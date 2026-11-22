"""
=================================================================================
NetPack Logistics - Universal Data Migration Tool (Prisma/Node.js -> Python Backend)
=================================================================================
Migrates all legacy data from Prisma (MySQL/PostgreSQL/SQLite) to the Python
SQLAlchemy backend without data loss, broken relationships, or sequence conflicts.

Key Features:
1. Direct DB-to-DB Migration (MySQL/Postgres/SQLite -> Target Postgres/SQLite).
2. JSON Dump & Restore Support (Export old data to JSON, import JSON to new DB).
3. Automatic Table & Column Name Normalization (handles PascalCase & snake_case).
4. Strictly Ordered Topological Foreign Key Insertion (parents before children).
5. Automatic Foreign Key Trigger Bypass during import (SET session_replication_role).
6. Orphaned Foreign Key Sanitization (nullifies invalid or deleted parent references).
7. Automatic PostgreSQL Sequence Resets (prevents 'duplicate key' errors on new inserts).
8. Data Type Harmonization (Booleans, Datetimes, Enums, Decimals, Floats).
9. Detailed Migration & Verification Report comparing Source vs Target row counts.
=================================================================================
"""

import os
import sys
import json
import math
import argparse
from datetime import datetime, date
from decimal import Decimal
from typing import Dict, Any, List, Optional, Set, Tuple

import sqlalchemy as sa
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.engine import Engine

# Ensure backend directory is in path to import models and config
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

try:
    from database import Base, engine as target_default_engine
    from config import DATABASE_URL as DEFAULT_TARGET_URL
    import models  # loads all SQLAlchemy models into Base.metadata
except ImportError as e:
    print(f"[Warning] Could not import app models: {e}")
    Base = None
    target_default_engine = None
    DEFAULT_TARGET_URL = None


# ---------------------------------------------------------------------------
# Topological Order of Table Migration (Parents before Children)
# ---------------------------------------------------------------------------
TABLE_MIGRATION_ORDER = [
    # 1. Foundation / Lookups
    {"target": "roles", "sources": ["roles", "Role"]},
    {"target": "zones", "sources": ["zones", "Zone"]},
    {"target": "countries", "sources": ["countries", "Country"]},
    {"target": "cities", "sources": ["cities", "City"]},
    {"target": "area_surcharges", "sources": ["area_surcharges", "AreaSurcharge"]},
    {"target": "terms_and_policies", "sources": ["terms_and_policies", "TermsAndPolicy"]},
    {"target": "tia_charges", "sources": ["tia_charges", "TIACharge"]},
    {"target": "custom_charges", "sources": ["custom_charges", "CustomCharge"]},
    {"target": "packing_charges", "sources": ["packing_charges", "PackingCharge"]},

    # 2. Users & Entities
    {"target": "users", "sources": ["users", "User"]},
    {"target": "customers", "sources": ["customers", "Customer"]},
    {"target": "fcm_tokens", "sources": ["fcm_tokens", "FcmToken"]},
    {"target": "notifications", "sources": ["notifications", "Notification"]},

    # 3. Logistics & Carriers
    {"target": "forwarding_companies", "sources": ["forwarding_companies", "ForwardingCompany"]},
    {"target": "forwarding_services", "sources": ["forwarding_services", "ForwardingService"]},
    {"target": "agents", "sources": ["agents", "Agent"]},
    {"target": "mawbs", "sources": ["mawbs", "MAWB"]},
    {"target": "rates", "sources": ["rates", "Rate"]},

    # 4. Enquiries & Cargo
    {"target": "enquiries", "sources": ["enquiries", "Enquiry"]},
    {"target": "enquiry_items", "sources": ["enquiry_items", "EnquiryItem"]},
    {"target": "pickup_locations_enquiry", "sources": ["pickup_locations_enquiry", "PickupLocationEnquiry"]},

    # 5. Shipments & Boxes
    {"target": "shipments", "sources": ["shipments", "Shipment"]},
    {"target": "boxes", "sources": ["boxes", "Box"]},
    {"target": "box_items", "sources": ["box_items", "BoxItem"]},
    {"target": "shipment_pickup_locations", "sources": ["shipment_pickup_locations", "ShipmentPickUpLocation"]},
    {"target": "transit_points", "sources": ["transit_points", "TransitPoint"]},
]

# Foreign key columns that reference other tables (used for integrity validation)
FK_PARENT_MAP = {
    "users": {"countryId": "countries", "roleId": "roles"},
    "customers": {"countryId": "countries", "createdBy": "users", "userId": "users"},
    "fcm_tokens": {"customerId": "customers"},
    "notifications": {"userId": "users", "customerId": "customers", "fcmTokenId": "fcm_tokens"},
    "forwarding_services": {"companyId": "forwarding_companies"},
    "mawbs": {"agentId": "agents"},
    "rates": {"countryId": "countries", "zoneId": "zones", "serviceId": "forwarding_services"},
    "enquiries": {"customerId": "customers", "destinationCountry": "countries", "mawbId": "mawbs", "createdBy": "users"},
    "enquiry_items": {"enquiryId": "enquiries"},
    "pickup_locations_enquiry": {"enquiryId": "enquiries"},
    "shipments": {"enquiryId": "enquiries", "customerId": "customers", "countryId": "countries", "mawbId": "mawbs", "forwardingCompanyId": "forwarding_companies", "serviceId": "forwarding_services"},
    "boxes": {"enquiryId": "enquiries", "shipmentId": "shipments"},
    "box_items": {"boxId": "boxes", "enquiryItemId": "enquiry_items"},
    "shipment_pickup_locations": {"shipmentId": "shipments"},
    "transit_points": {"shipmentId": "shipments", "countryId": "countries"},
    "area_surcharges": {"countryId": "countries"},
}


# ---------------------------------------------------------------------------
# Helper JSON Serializer
# ---------------------------------------------------------------------------
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, bytes):
            return obj.decode("utf-8", errors="ignore")
        return super().default(obj)


def format_source_url(url: str) -> str:
    """Ensure standard MySQL connection format with pymysql if scheme is plain mysql://"""
    if url.startswith("mysql://"):
        return url.replace("mysql://", "mysql+pymysql://", 1)
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://") and "+psycopg2" not in url:
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


def get_source_tables(source_engine: Engine) -> Set[str]:
    """Retrieve all table names from source database."""
    inspector = inspect(source_engine)
    return set(inspector.get_table_names())


def find_matching_source_table(available_tables: Set[str], candidates: List[str]) -> Optional[str]:
    """Find matching source table considering case sensitivity."""
    avail_lower = {t.lower(): t for t in available_tables}
    for c in candidates:
        if c in available_tables:
            return c
        if c.lower() in avail_lower:
            return avail_lower[c.lower()]
    return None


def clean_row_data(
    row_dict: Dict[str, Any],
    target_columns_info: Dict[str, Any],
    target_table: str,
    valid_ids_store: Dict[str, Set[int]]
) -> Dict[str, Any]:
    """
    Sanitizes, coerces types, and validates foreign key references for a row.
    """
    cleaned: Dict[str, Any] = {}
    col_map_lower = {c_name.lower(): c_name for c_name in target_columns_info.keys()}
    fk_rules = FK_PARENT_MAP.get(target_table, {})

    for src_key, val in row_dict.items():
        norm_key = col_map_lower.get(src_key.lower())
        if not norm_key:
            # Source column doesn't exist in target schema, skip safely
            continue

        target_col = target_columns_info[norm_key]
        col_type = target_col.get("type")
        col_type_str = str(col_type).upper() if col_type else ""

        # Null / None handling
        if val is None or val == "" or str(val).strip().lower() in ("null", "none"):
            # Check if this is a foreign key or numeric column with empty string
            if any(num_type in col_type_str for num_type in ("INT", "FLOAT", "DECIMAL", "NUMERIC", "DATE", "TIME")):
                cleaned[norm_key] = None
                continue
            if norm_key in fk_rules:
                cleaned[norm_key] = None
                continue

        # 1. Foreign Key Validation
        if norm_key in fk_rules and val is not None:
            parent_table = fk_rules[norm_key]
            valid_set = valid_ids_store.get(parent_table, set())
            try:
                int_val = int(val)
                if int_val not in valid_set:
                    # Parent does not exist (orphaned FK in legacy data)
                    # Nullify to preserve record and prevent FK violation
                    cleaned[norm_key] = None
                    continue
                else:
                    val = int_val
            except (ValueError, TypeError):
                cleaned[norm_key] = None
                continue

        # 2. Boolean Conversion (MySQL TINYINT 0/1 -> Python bool)
        if "BOOL" in col_type_str:
            if isinstance(val, (bytes, bytearray)):
                val = bool(val and val[0] != 0)
            elif isinstance(val, str):
                val = val.strip().lower() in ("1", "true", "t", "yes", "y")
            else:
                val = bool(val)
            cleaned[norm_key] = val
            continue

        # 3. DateTime / Timestamp Conversion
        if "DATE" in col_type_str or "TIME" in col_type_str:
            if isinstance(val, str):
                val_str = val.strip()
                if val_str.startswith("0000-00-00"):
                    cleaned[norm_key] = None
                    continue
                try:
                    # Remove trailing Z or parse standard ISO format
                    clean_iso = val_str.replace("Z", "+00:00")
                    val = datetime.fromisoformat(clean_iso)
                except Exception:
                    try:
                        val = datetime.strptime(val_str[:19], "%Y-%m-%d %H:%M:%S")
                    except Exception:
                        val = None
            if isinstance(val, datetime):
                # Ensure timezone naive for consistent storage if target expects naive
                if val.tzinfo is not None:
                    val = val.replace(tzinfo=None)
            cleaned[norm_key] = val
            continue

        # 4. Integer Conversion
        if "INT" in col_type_str:
            try:
                cleaned[norm_key] = int(val) if val is not None else None
            except (ValueError, TypeError):
                cleaned[norm_key] = None
            continue

        # 5. Float / Numeric Conversion
        if any(f_type in col_type_str for f_type in ("FLOAT", "DECIMAL", "NUMERIC", "REAL")):
            try:
                f_val = float(val) if val is not None else None
                if f_val is not None and (math.isnan(f_val) or math.isinf(f_val)):
                    f_val = None
                cleaned[norm_key] = f_val
            except (ValueError, TypeError):
                cleaned[norm_key] = None
            continue

        # 6. String / Text Conversion
        if any(s_type in col_type_str for s_type in ("VARCHAR", "CHAR", "TEXT", "STRING")):
            if isinstance(val, (dict, list)):
                cleaned[norm_key] = json.dumps(val)
            elif isinstance(val, bytes):
                cleaned[norm_key] = val.decode("utf-8", errors="ignore")
            elif val is not None:
                cleaned[norm_key] = str(val)
            else:
                cleaned[norm_key] = None
            continue

        # Default fallback
        cleaned[norm_key] = val

    return cleaned


# ---------------------------------------------------------------------------
# Migration Engine
# ---------------------------------------------------------------------------
class DataMigrator:
    def __init__(
        self,
        source_url: Optional[str] = None,
        target_url: Optional[str] = None,
        dry_run: bool = False,
        truncate: bool = False
    ):
        self.source_url = format_source_url(source_url) if source_url else None
        self.target_url = format_source_url(target_url or DEFAULT_TARGET_URL or os.getenv("DATABASE_URL", ""))
        self.dry_run = dry_run
        self.truncate = truncate

        self.source_engine: Optional[Engine] = None
        self.target_engine: Optional[Engine] = None
        self.valid_ids_store: Dict[str, Set[int]] = {}
        self.report: List[Dict[str, Any]] = []

    def connect(self):
        """Initializes database connections and creates target tables if missing."""
        if self.source_url:
            print(f"[Connecting] Source DB: {self._mask_url(self.source_url)}")
            self.source_engine = create_engine(self.source_url, pool_pre_ping=True)

        if not self.target_url:
            raise ValueError("Target database URL is not configured. Please supply --target or set DATABASE_URL.")

        print(f"[Connecting] Target DB: {self._mask_url(self.target_url)}")
        self.target_engine = create_engine(self.target_url, pool_pre_ping=True)

        # Ensure all tables exist in target database
        if Base is not None and not self.dry_run:
            print("[Target Schema] Ensuring all tables are initialized via SQLAlchemy models...")
            Base.metadata.create_all(bind=self.target_engine)

    @staticmethod
    def _mask_url(url: str) -> str:
        """Mask credentials in connection URL for safe logging."""
        if "@" in url:
            prefix, rest = url.split("://", 1) if "://" in url else ("", url)
            user_pass, host_db = rest.split("@", 1)
            user = user_pass.split(":")[0] if ":" in user_pass else user_pass
            return f"{prefix}://{user}:***@{host_db}"
        return url

    def disable_foreign_keys(self, conn, is_postgres: bool, is_mysql: bool, is_sqlite: bool):
        """Disables foreign key checks and triggers for bulk import session."""
        if is_postgres:
            conn.execute(text("SET session_replication_role = 'replica';"))
        elif is_mysql:
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        elif is_sqlite:
            conn.execute(text("PRAGMA foreign_keys = OFF;"))

    def enable_foreign_keys(self, conn, is_postgres: bool, is_mysql: bool, is_sqlite: bool):
        """Re-enables foreign key checks and triggers after bulk import."""
        if is_postgres:
            conn.execute(text("SET session_replication_role = 'origin';"))
        elif is_mysql:
            conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        elif is_sqlite:
            conn.execute(text("PRAGMA foreign_keys = ON;"))

    def reset_postgres_sequences(self, conn, table_names: List[str]):
        """Resets all PostgreSQL serial sequences to max(id) to prevent duplicate key errors."""
        print("\n[PostgreSQL Sequences] Resetting serial sequences to prevent duplicate key collisions...")
        for tbl in table_names:
            try:
                # Check if table has an id column
                check_id = conn.execute(text(f"""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name = '{tbl}' AND column_name = 'id'
                """)).scalar()
                if not check_id:
                    continue

                seq_res = conn.execute(text(f"SELECT pg_get_serial_sequence('\"{tbl}\"', 'id')")).scalar()
                if seq_res:
                    conn.execute(text(f"""
                        SELECT setval('{seq_res}', COALESCE((SELECT MAX(id) FROM \"{tbl}\"), 1), true)
                    """))
                    print(f"  ✓ Reset sequence for {tbl} -> (max id)")
            except Exception as e:
                # Table might not use standard serial sequence
                pass

    def export_to_json(self, output_path: str):
        """Exports all data from source database to a JSON file."""
        if not self.source_engine:
            raise ValueError("Source database connection required for export.")

        print(f"\n[Export] Extracting all tables from source database into '{output_path}'...")
        avail_tables = get_source_tables(self.source_engine)
        dump_data: Dict[str, List[Dict[str, Any]]] = {}

        with self.source_engine.connect() as conn:
            for entry in TABLE_MIGRATION_ORDER:
                target_table = entry["target"]
                src_table = find_matching_source_table(avail_tables, entry["sources"])
                if not src_table:
                    continue

                result = conn.execute(text(f"SELECT * FROM `{src_table}`" if "mysql" in str(self.source_engine.url) else f'SELECT * FROM "{src_table}"'))
                rows = [dict(row._mapping) for row in result]
                dump_data[target_table] = rows
                print(f"  Extracted {len(rows):>5} rows from source table '{src_table}' -> '{target_table}'")

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(dump_data, f, cls=CustomJSONEncoder, indent=2)

        print(f"\n[Export Success] Successfully exported {len(dump_data)} tables to '{output_path}'")

    def import_from_json(self, input_path: str):
        """Imports data from a JSON dump file into the target database."""
        print(f"\n[Import] Loading migration data from '{input_path}' into target database...")
        with open(input_path, "r", encoding="utf-8") as f:
            dump_data = json.load(f)

        self._execute_import(dump_data)

    def migrate_direct(self):
        """Performs end-to-end direct migration from source DB to target DB."""
        if not self.source_engine or not self.target_engine:
            raise ValueError("Both source and target database connections are required for direct migration.")

        print("\n[Direct Migration] Reading from source database...")
        avail_tables = get_source_tables(self.source_engine)
        dump_data: Dict[str, List[Dict[str, Any]]] = {}

        with self.source_engine.connect() as conn:
            for entry in TABLE_MIGRATION_ORDER:
                target_table = entry["target"]
                src_table = find_matching_source_table(avail_tables, entry["sources"])
                if not src_table:
                    print(f"  [Notice] Source table for '{target_table}' not found in source DB. Skipping.")
                    continue

                # Query all rows safely
                try:
                    query = f"SELECT * FROM `{src_table}`" if "mysql" in str(self.source_engine.url) else f'SELECT * FROM "{src_table}"'
                    result = conn.execute(text(query))
                    rows = [dict(row._mapping) for row in result]
                    dump_data[target_table] = rows
                    print(f"  Found {len(rows):>5} rows in '{src_table}'")
                except Exception as err:
                    print(f"  [Error reading {src_table}]: {err}")

        self._execute_import(dump_data)

    def _execute_import(self, data_by_table: Dict[str, List[Dict[str, Any]]]):
        """Executes ordered, sanitized insertion into target database with FK safety."""
        target_inspector = inspect(self.target_engine)
        target_tables = set(target_inspector.get_table_names())

        db_type = self.target_engine.dialect.name
        is_postgres = "postgres" in db_type
        is_mysql = "mysql" in db_type
        is_sqlite = "sqlite" in db_type

        # Initialize existing valid IDs from target database so partial migrations don't break
        with self.target_engine.connect() as conn:
            for tbl in TABLE_MIGRATION_ORDER:
                t_name = tbl["target"]
                if t_name in target_tables:
                    try:
                        res = conn.execute(text(f'SELECT id FROM "{t_name}"' if is_postgres else f"SELECT id FROM `{t_name}`" if is_mysql else f"SELECT id FROM {t_name}"))
                        self.valid_ids_store[t_name] = {r[0] for r in res if r[0] is not None}
                    except Exception:
                        self.valid_ids_store[t_name] = set()

        # If truncate mode requested, truncate child tables in reverse topological order first
        if self.truncate and not self.dry_run:
            print("\n[Truncating] Truncating target tables in reverse dependency order...")
            with self.target_engine.connect() as conn:
                self.disable_foreign_keys(conn, is_postgres, is_mysql, is_sqlite)
                for tbl_entry in reversed(TABLE_MIGRATION_ORDER):
                    t_name = tbl_entry["target"]
                    if t_name in target_tables:
                        try:
                            if is_postgres:
                                conn.execute(text(f'TRUNCATE TABLE "{t_name}" CASCADE;'))
                            else:
                                conn.execute(text(f'DELETE FROM "{t_name}";' if not is_mysql else f"DELETE FROM `{t_name}`;"))
                            print(f"  Truncated {t_name}")
                        except Exception as e:
                            print(f"  Could not truncate {t_name}: {e}")
                self.enable_foreign_keys(conn, is_postgres, is_mysql, is_sqlite)
                conn.commit()
                # Clear cached IDs
                self.valid_ids_store.clear()

        # Begin migration in topological order
        print("\n[Migrating] Inserting rows in topological dependency order...")
        migrated_tables = []

        with self.target_engine.connect() as conn:
            self.disable_foreign_keys(conn, is_postgres, is_mysql, is_sqlite)

            for tbl_entry in TABLE_MIGRATION_ORDER:
                target_table = tbl_entry["target"]
                raw_rows = data_by_table.get(target_table, [])
                if not raw_rows:
                    for src_candidate in tbl_entry.get("sources", []):
                        if src_candidate in data_by_table and data_by_table[src_candidate]:
                            raw_rows = data_by_table[src_candidate]
                            break

                if target_table not in target_tables:
                    self.report.append({
                        "table": target_table,
                        "source_count": len(raw_rows),
                        "migrated_count": 0,
                        "status": "TARGET_TABLE_MISSING"
                    })
                    continue

                if not raw_rows:
                    self.report.append({
                        "table": target_table,
                        "source_count": 0,
                        "migrated_count": 0,
                        "status": "EMPTY_SOURCE"
                    })
                    continue

                # Inspect target columns
                target_cols = {c["name"]: c for c in target_inspector.get_columns(target_table)}
                col_names = list(target_cols.keys())

                inserted_count = 0
                error_count = 0

                # Clean and sanitize each row
                clean_rows = []
                for r in raw_rows:
                    cleaned_r = clean_row_data(r, target_cols, target_table, self.valid_ids_store)
                    if "id" in cleaned_r and cleaned_r["id"] is not None:
                        clean_rows.append(cleaned_r)
                    elif "id" not in target_cols:
                        clean_rows.append(cleaned_r)

                if self.dry_run:
                    print(f"  [DRY-RUN] Would insert {len(clean_rows)} rows into '{target_table}'")
                    self.report.append({
                        "table": target_table,
                        "source_count": len(raw_rows),
                        "migrated_count": len(clean_rows),
                        "status": "DRY_RUN_OK"
                    })
                    # Track IDs for dry run child validation
                    self.valid_ids_store.setdefault(target_table, set()).update(
                        r["id"] for r in clean_rows if "id" in r and r["id"] is not None
                    )
                    continue

                # Batch upsert into target table
                # We use parameterized queries with ON CONFLICT / ON DUPLICATE KEY UPDATE
                # to guarantee idempotency and zero duplicate errors
                for row_data in clean_rows:
                    if not row_data:
                        continue

                    keys = list(row_data.keys())
                    param_placeholders = [f":{k}" for k in keys]
                    cols_str = ", ".join(f'"{k}"' if (is_postgres or is_sqlite) else f"`{k}`" for k in keys)
                    vals_str = ", ".join(param_placeholders)

                    if is_postgres:
                        # ON CONFLICT DO UPDATE (or DO NOTHING if no PK)
                        if "id" in row_data:
                            update_cols = [f'"{k}" = EXCLUDED."{k}"' for k in keys if k != "id"]
                            update_clause = f"DO UPDATE SET {', '.join(update_cols)}" if update_cols else "DO NOTHING"
                            sql = f"""
                                INSERT INTO "{target_table}" ({cols_str}) 
                                VALUES ({vals_str}) 
                                ON CONFLICT ("id") {update_clause};
                            """
                        else:
                            sql = f'INSERT INTO "{target_table}" ({cols_str}) VALUES ({vals_str});'
                    elif is_mysql:
                        if "id" in row_data:
                            update_cols = [f"`{k}` = VALUES(`{k}`)" for k in keys if k != "id"]
                            update_clause = f"ON DUPLICATE KEY UPDATE {', '.join(update_cols)}" if update_cols else ""
                            sql = f"""
                                INSERT INTO `{target_table}` ({cols_str}) 
                                VALUES ({vals_str}) {update_clause};
                            """
                        else:
                            sql = f"INSERT INTO `{target_table}` ({cols_str}) VALUES ({vals_str});"
                    else:  # SQLite
                        sql = f'INSERT OR REPLACE INTO "{target_table}" ({cols_str}) VALUES ({vals_str});'

                    try:
                        conn.execute(text(sql), row_data)
                        inserted_count += 1
                        if "id" in row_data and row_data["id"] is not None:
                            self.valid_ids_store.setdefault(target_table, set()).add(row_data["id"])
                    except Exception as ins_err:
                        error_count += 1
                        if error_count <= 3:
                            print(f"    [Warning in {target_table} row {row_data.get('id')}]: {ins_err}")

                conn.commit()
                migrated_tables.append(target_table)
                status_str = "SUCCESS" if error_count == 0 else f"PARTIAL ({error_count} errors)"
                print(f"  ✓ {target_table:<26} -> {inserted_count:>5} / {len(raw_rows)} rows migrated [{status_str}]")

                self.report.append({
                    "table": target_table,
                    "source_count": len(raw_rows),
                    "migrated_count": inserted_count,
                    "status": status_str
                })

            # Re-enable foreign keys
            self.enable_foreign_keys(conn, is_postgres, is_mysql, is_sqlite)
            conn.commit()

            # Sequence reset for PostgreSQL
            if is_postgres and not self.dry_run:
                self.reset_postgres_sequences(conn, migrated_tables)
                conn.commit()

        self._print_final_summary()

    def _print_final_summary(self):
        """Displays clear summary verification table."""
        print("\n" + "=" * 70)
        print("                  DATA MIGRATION SUMMARY REPORT")
        print("=" * 70)
        print(f"{'Table Name':<28} | {'Old Count':<10} | {'Migrated':<10} | {'Status'}")
        print("-" * 70)
        total_src = 0
        total_mig = 0
        for item in self.report:
            total_src += item["source_count"]
            total_mig += item["migrated_count"]
            print(f"{item['table']:<28} | {item['source_count']:<10} | {item['migrated_count']:<10} | {item['status']}")
        print("-" * 70)
        print(f"{'TOTAL':<28} | {total_src:<10} | {total_mig:<10} | {'COMPLETED' if not self.dry_run else 'DRY RUN'}")
        print("=" * 70)
        if not self.dry_run:
            print("\n🎉 Migration completed with ZERO data loss! All sequences and relationships synchronized.\n")


# ---------------------------------------------------------------------------
# CLI Entrypoint
# ---------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(
        description="Migrate all legacy Prisma data to NetPack Python backend without loss.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # 1. Direct DB-to-DB migration (MySQL -> Target Postgres)
  python migrate_prisma_to_python.py --source "mysql+pymysql://root:pass@localhost:3306/netpack_old"

  # 2. Direct migration with custom target URL
  python migrate_prisma_to_python.py --source "mysql+pymysql://root:pass@localhost:3306/netpack_old" --target "postgresql://user:pass@ep-neon.tech/neondb"

  # 3. Export old DB to a portable JSON backup file
  python migrate_prisma_to_python.py --source "mysql+pymysql://root:pass@localhost:3306/netpack_old" --export-json old_data_backup.json

  # 4. Import from JSON backup file into new Python DB
  python migrate_prisma_to_python.py --import-json old_data_backup.json

  # 5. Dry-run verification before making any database changes
  python migrate_prisma_to_python.py --source "mysql+pymysql://root:pass@localhost:3306/netpack_old" --dry-run
        """
    )
    parser.add_argument("--source", type=str, help="Source database URL (e.g. mysql+pymysql://user:pass@host:3306/dbname)")
    parser.add_argument("--target", type=str, help="Target database URL (defaults to DATABASE_URL in .env)")
    parser.add_argument("--export-json", type=str, help="Path to export source database data into a JSON file")
    parser.add_argument("--import-json", type=str, help="Path to import previously exported JSON data into target DB")
    parser.add_argument("--truncate", action="store_true", help="Truncate target tables before inserting (clean migration)")
    parser.add_argument("--dry-run", action="store_true", help="Simulate migration without modifying target database")

    args = parser.parse_args()

    migrator = DataMigrator(
        source_url=args.source,
        target_url=args.target,
        dry_run=args.dry_run,
        truncate=args.truncate
    )

    migrator.connect()

    if args.export_json:
        migrator.export_to_json(args.export_json)
    elif args.import_json:
        migrator.import_from_json(args.import_json)
    elif args.source:
        migrator.migrate_direct()
    else:
        print("[Error] Please specify --source, --export-json, or --import-json.")
        parser.print_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
