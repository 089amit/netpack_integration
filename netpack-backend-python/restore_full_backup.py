import sys
import os
import json
from datetime import datetime

sys.path.append(os.path.abspath("netpack-backend-python"))
from config import DATABASE_URL, BASE_DIR
from sqlalchemy import create_engine, text

def run_restore(backup_path=None):
    engine = create_engine(DATABASE_URL)
    in_file = backup_path or (BASE_DIR / "full_production_backup_latest.json")

    if not os.path.exists(in_file):
        print(f"[Error] Backup file {in_file} does not exist!")
        return

    print(f"[*] Reading full backup snapshot from {in_file}...")
    with open(in_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    tables_data = data.get("tables", {})
    print(f"[*] Loaded snapshot with {len(tables_data)} tables. Starting transaction restore...")

    ordered_tables = [
        "roles", "zones", "countries", "cities", "users", "customers",
        "custom_manifest_hubs", "customs_consignees", "customs_settings",
        "website_contents", "terms_and_policies",
        "tia_charges", "custom_charges", "packing_charges",
        "area_surcharges", "rates", "agents", "forwarding_companies", "forwarding_services",
        "mawbs", "enquiries", "enquiry_items", "pickup_locations_enquiry",
        "shipments", "boxes", "box_items", "shipment_pickup_locations",
        "tracking_events", "notifications", "fcm_tokens", "uploaded_files",
        "transit_points", "surcharge_rules"
    ]

    with engine.begin() as conn:
        conn.execute(text("SET session_replication_role = 'replica';"))

        for t in ordered_tables:
            rows = tables_data.get(t, [])
            conn.execute(text(f'TRUNCATE TABLE "{t}" CASCADE;'))
            if rows:
                cols = list(rows[0].keys())
                col_names = ", ".join([f'"{c}"' for c in cols])
                val_placeholders = ", ".join([f":{c}" for c in cols])
                stmt = text(f'INSERT INTO "{t}" ({col_names}) VALUES ({val_placeholders})')
                conn.execute(stmt, rows)
                print(f"  [+] Restored {t}: {len(rows)} records")
            else:
                print(f"  [-] Table {t} is empty in backup")

        conn.execute(text("SET session_replication_role = 'origin';"))

        for t in ordered_tables:
            try:
                conn.execute(text(f"""
                    SELECT setval(pg_get_serial_sequence('"{t}"', 'id'), COALESCE(MAX(id), 1), true)
                    FROM "{t}";
                """))
            except Exception:
                pass

    print("[SUCCESS] Complete database restoration finished successfully!")

if __name__ == "__main__":
    run_restore()
