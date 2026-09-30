"""
ETL Migration Script: Imports complete legacy NetPack MySQL dump (netpack.sql)
into the current database (supports both SQLite and PostgreSQL via SQLAlchemy).
"""

import os
import re
import sys
import time
from datetime import datetime
from collections import defaultdict
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config import DATABASE_URL

# Table mapping: Dump Table -> Target Table
TABLE_MAPPINGS = [
    ('roles', 'roles'),
    ('zones', 'zones'),
    ('Country', 'countries'),
    ('users', 'users'),
    ('customers', 'customers'),
    ('Agent', 'agents'),
    ('mawbs', 'mawbs'),
    ('forwarding_companies', 'forwarding_companies'),
    ('ForwardingService', 'forwarding_services'),
    ('rates', 'rates'),
    ('Enquiry', 'enquiries'),
    ('EnquiryItem', 'enquiry_items'),
    ('PickupLocationEnquiry', 'pickup_locations_enquiry'),
    ('Shipment', 'shipments'),
    ('Box', 'boxes'),
    ('BoxItem', 'box_items'),
    ('ShipmentPickUpLocation', 'shipment_pickup_locations'),
    ('area_surcharges', 'area_surcharges'),
    ('terms_and_policies', 'terms_and_policies'),
    ('fcm_tokens', 'fcm_tokens'),
    ('Notification', 'notifications'),
    ('TIACharge', 'tia_charges'),
    ('CustomCharge', 'custom_charges'),
    ('PackingCharge', 'packing_charges'),
]

def parse_sql_tuples(values_str):
    """
    Fast streaming tokenizer that parses MySQL VALUES string tuples:
    "(1, 'abc', NULL), (2, 'xyz', 4.5)"
    """
    idx = 0
    length = len(values_str)
    
    while idx < length:
        while idx < length and values_str[idx] != '(':
            idx += 1
        if idx >= length:
            break
        
        idx += 1 # skip '('
        row = []
        
        while idx < length:
            while idx < length and values_str[idx] in ' \t\r\n':
                idx += 1
            if idx >= length:
                break
                
            if values_str[idx] == ')':
                idx += 1
                yield row
                break
                
            if values_str[idx] == "'":
                idx += 1
                chars = []
                while idx < length:
                    c = values_str[idx]
                    if c == '\\':
                        idx += 1
                        if idx < length:
                            esc = values_str[idx]
                            if esc == 'n': chars.append('\n')
                            elif esc == 'r': chars.append('\r')
                            elif esc == 't': chars.append('\t')
                            elif esc == '0': chars.append('\0')
                            else: chars.append(esc)
                        idx += 1
                    elif c == "'":
                        if idx + 1 < length and values_str[idx + 1] == "'":
                            chars.append("'")
                            idx += 2
                        else:
                            idx += 1
                            break
                    else:
                        chars.append(c)
                        idx += 1
                row.append("".join(chars))
            else:
                token = []
                while idx < length and values_str[idx] not in ',)':
                    token.append(values_str[idx])
                    idx += 1
                tok = "".join(token).strip()
                if tok.upper() == 'NULL' or tok == '':
                    row.append(None)
                elif tok.isdigit() or (tok.startswith('-') and tok[1:].isdigit()):
                    row.append(int(tok))
                else:
                    try:
                        row.append(float(tok))
                    except ValueError:
                        row.append(tok)
            
            while idx < length and values_str[idx] in ' \t\r\n':
                idx += 1
            if idx < length and values_str[idx] == ',':
                idx += 1

def parse_dump_columns(sql_path):
    """
    Extracts the ordered column definitions from CREATE TABLE statements in the dump.
    """
    cols_map = {}
    current_table = None
    with open(sql_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            m = re.match(r"CREATE TABLE [`']?(\w+)[`']?", line, re.IGNORECASE)
            if m:
                current_table = m.group(1)
                cols_map[current_table] = []
                continue
            if current_table:
                if line.strip().startswith(")"):
                    current_table = None
                else:
                    col_m = re.match(r"\s*[`']?(\w+)[`']?\s+([A-Za-z0-9_()]+)", line)
                    if col_m and not line.strip().startswith(("PRIMARY KEY", "KEY", "CONSTRAINT", "UNIQUE KEY")):
                        cols_map[current_table].append(col_m.group(1))
    return cols_map

def run_migration(sql_path=None, target_db_url=None):
    if not sql_path:
        sql_path = r"c:\Users\Postronix\Desktop\netpack.sql"
    if not target_db_url:
        target_db_url = DATABASE_URL

    print(f"============================================================")
    print(f"Starting NetPack MySQL Dump -> SQLAlchemy Migration")
    print(f"Source: {sql_path}")
    print(f"Target: {target_db_url.split('@')[-1] if '@' in target_db_url else target_db_url}")
    print(f"============================================================\n")

    if not os.path.exists(sql_path):
        print(f"Error: SQL dump not found at {sql_path}")
        return False

    is_sqlite = "sqlite" in target_db_url.lower()
    is_postgres = "postgres" in target_db_url.lower()

    if target_db_url.startswith("postgresql://"):
        target_db_url = target_db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    elif target_db_url.startswith("postgres://"):
        target_db_url = target_db_url.replace("postgres://", "postgresql+psycopg2://", 1)

    connect_args = {"check_same_thread": False} if is_sqlite else {
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
        "connect_timeout": 30
    }
    engine = sa.create_engine(target_db_url, connect_args=connect_args, pool_pre_ping=True, pool_recycle=300)

    # 1. Parse dump column schema
    dump_cols_map = parse_dump_columns(sql_path)
    print(f"Parsed {len(dump_cols_map)} table schemas from MySQL dump.\n")

    # 2. Inspect target database columns
    inspector = sa.inspect(engine)
    existing_target_tables = set(inspector.get_table_names())
    target_cols_map = {}
    for _, target_tbl in TABLE_MAPPINGS:
        if target_tbl in existing_target_tables:
            target_cols_map[target_tbl] = {c["name"]: c for c in inspector.get_columns(target_tbl)}

    start_time = time.time()
    migrated_counts = defaultdict(int)

    with engine.connect() as conn:
        # Disable foreign key checks for clean migration
        if is_sqlite:
            conn.execute(sa.text("PRAGMA foreign_keys = OFF;"))
        elif is_postgres:
            conn.execute(sa.text("SET session_replication_role = 'replica';"))
        conn.commit()

        # Truncate / delete existing rows in target tables (reverse dependency order)
        print("Clearing existing mock data in target tables...")
        if is_postgres:
            raw_conn = conn.connection.dbapi_connection
            cur = raw_conn.cursor()
            for _, target_tbl in reversed(TABLE_MAPPINGS):
                if target_tbl in existing_target_tables:
                    cur.execute(f'TRUNCATE TABLE "{target_tbl}" CASCADE;')
            raw_conn.commit()
            cur.close()
        else:
            for _, target_tbl in reversed(TABLE_MAPPINGS):
                if target_tbl in existing_target_tables:
                    conn.execute(sa.text(f"DELETE FROM {target_tbl};"))
            conn.commit()
        print("Target tables cleared.\n")

        # Process the dump file line by line
        print("Reading dump and inserting data...")
        with open(sql_path, "r", encoding="utf-8", errors="ignore") as f:
            for line_no, line in enumerate(f):
                insert_match = re.match(r"INSERT INTO [`']?(\w+)[`']?\s+VALUES\s*", line, re.IGNORECASE)
                if not insert_match:
                    continue

                dump_tbl = insert_match.group(1)
                # Find matching target table
                target_tbl = dict(TABLE_MAPPINGS).get(dump_tbl)
                if not target_tbl or target_tbl not in target_cols_map:
                    continue

                dump_cols = dump_cols_map.get(dump_tbl, [])
                target_cols = target_cols_map[target_tbl]

                val_str = line[insert_match.end():]
                batch_rows = []

                for raw_row in parse_sql_tuples(val_str):
                    if len(raw_row) != len(dump_cols):
                        continue

                    # Construct dictionary mapping dump column to value
                    row_dict = {}
                    for col_name, val in zip(dump_cols, raw_row):
                        if col_name in target_cols:
                            col_type_str = str(target_cols[col_name]["type"]).upper()
                            if "BOOL" in col_type_str:
                                if val is not None:
                                    val = bool(val) and val not in (0, "0", "false", "FALSE")
                            elif any(t in col_type_str for t in ("INT", "FLOAT", "NUMERIC", "DECIMAL", "DOUBLE", "REAL")):
                                if val == "" or val is None:
                                    val = None
                            elif any(t in col_type_str for t in ("TIME", "DATE")):
                                if val == "":
                                    val = None
                            row_dict[col_name] = val

                    # Add intelligent defaults for new system columns
                    if target_tbl == 'enquiries':
                        if 'trackingMode' not in row_dict or not row_dict['trackingMode']:
                            row_dict['trackingMode'] = 'MANUAL'
                        if 'pickupRequired' not in row_dict:
                            row_dict['pickupRequired'] = True
                        if 'isFromCustomer' not in row_dict:
                            row_dict['isFromCustomer'] = False
                        if 'isPacked' not in row_dict:
                            row_dict['isPacked'] = False
                        if 'volumetricWeight' not in row_dict or row_dict['volumetricWeight'] is None:
                            row_dict['volumetricWeight'] = row_dict.get('weight') or 0.0
                        if 'chargeableWeight' not in row_dict or row_dict['chargeableWeight'] is None:
                            row_dict['chargeableWeight'] = row_dict.get('weight') or 0.0

                    elif target_tbl == 'shipments':
                        if 'trackingMode' not in row_dict or not row_dict['trackingMode']:
                            row_dict['trackingMode'] = 'MANUAL'

                    elif target_tbl == 'customers':
                        if 'photoUrl' not in row_dict:
                            row_dict['photoUrl'] = None

                    batch_rows.append(row_dict)

                # Batch insert into target table
                if batch_rows:
                    first_keys = list(batch_rows[0].keys())
                    if is_postgres:
                        from psycopg2.extras import execute_values
                        # Use raw connection for true multi-row bulk insert (1000 rows per round-trip!)
                        raw_conn = conn.connection.dbapi_connection
                        cur = raw_conn.cursor()
                        col_names_str = ", ".join([f'"{k}"' for k in first_keys])
                        if "id" in first_keys:
                            sql = f'INSERT INTO "{target_tbl}" ({col_names_str}) VALUES %s ON CONFLICT ("id") DO NOTHING'
                        else:
                            sql = f'INSERT INTO "{target_tbl}" ({col_names_str}) VALUES %s'
                        tuple_list = [tuple(row[k] for k in first_keys) for row in batch_rows]
                        execute_values(cur, sql, tuple_list, page_size=1000)
                        cur.close()
                        raw_conn.commit()
                    else:
                        chunk_size = 1000
                        for i in range(0, len(batch_rows), chunk_size):
                            chunk = batch_rows[i:i + chunk_size]
                            col_names_str = ", ".join([f'`{k}`' for k in first_keys])
                            placeholders = ", ".join([f":{k}" for k in first_keys])
                            sql_stmt = sa.text(f"INSERT INTO {target_tbl} ({col_names_str}) VALUES ({placeholders})")
                            conn.execute(sql_stmt, chunk)
                            conn.commit()

                    migrated_counts[target_tbl] += len(batch_rows)
                    print(f"  -> Migrated {migrated_counts[target_tbl]} rows to {target_tbl}", flush=True)

        # Re-enable foreign key checks & reset sequences
        if is_sqlite:
            conn.execute(sa.text("PRAGMA foreign_keys = ON;"))
        elif is_postgres:
            conn.execute(sa.text("SET session_replication_role = 'origin';"))
            print("Resetting PostgreSQL primary key auto-increment sequences...")
            for _, target_tbl in TABLE_MAPPINGS:
                try:
                    conn.execute(sa.text(f"""
                        SELECT setval(
                            pg_get_serial_sequence('"{target_tbl}"', 'id'),
                            COALESCE((SELECT MAX(id) FROM "{target_tbl}"), 1),
                            true
                        );
                    """))
                except Exception:
                    pass
            print("PostgreSQL sequences synchronized successfully.")

    elapsed = time.time() - start_time
    print(f"\n============================================================")
    print(f"Migration Completed in {elapsed:.2f} seconds!")
    print(f"============================================================")
    print(f"{'Target Table':<30} | {'Migrated Rows':<15}")
    print(f"{'-'*30}-|-{'-'*15}")
    for _, target_tbl in TABLE_MAPPINGS:
        cnt = migrated_counts.get(target_tbl, 0)
        print(f"{target_tbl:<30} | {cnt:<15}")
    print(f"============================================================\n")

    return True

if __name__ == "__main__":
    sql_arg = None
    db_arg = None
    for a in sys.argv[1:]:
        if a.startswith(("postgresql://", "postgres://", "postgresql+", "sqlite")):
            db_arg = a
        elif a.endswith(".sql") or os.path.exists(a):
            sql_arg = a
    run_migration(sql_path=sql_arg, target_db_url=db_arg)
