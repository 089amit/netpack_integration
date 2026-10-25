import sys
import os

sys.path.append(os.path.abspath("netpack-backend-python"))
from config import DATABASE_URL
from sqlalchemy import create_engine, text
from services.auth_service import get_password_hash

def main():
    print("[*] Connecting to Neon PostgreSQL...")
    engine = create_engine(DATABASE_URL)

    with engine.begin() as conn:
        # 1. Truncate operational and transactional tables in proper order with CASCADE in a single statement
        tables_to_clear = [
            "uploaded_files",
            "tracking_events",
            "notifications",
            "fcm_tokens",
            "shipment_pickup_locations",
            "pickup_locations_enquiry",
            "box_items",
            "boxes",
            "enquiry_items",
            "shipments",
            "enquiries",
            "mawbs",
            "custom_manifest_hubs",
            "customers",
            "users",
        ]

        print(f"[*] Truncating {len(tables_to_clear)} operational tables (including customs manifest hubs)...")
        truncate_sql = 'TRUNCATE TABLE ' + ', '.join([f'"{t}"' for t in tables_to_clear]) + ' CASCADE;'
        conn.execute(text(truncate_sql))
        print("  [+] Truncated successfully.")

        # Reset sequences for cleared tables
        for t in tables_to_clear:
            try:
                conn.execute(text(f"""
                    SELECT setval(pg_get_serial_sequence('"{t}"', 'id'), 1, false);
                """))
            except Exception:
                pass

        print("[*] Inserting clean test accounts...")

        # A. 1 Admin Account
        admin_pass = get_password_hash("Admin@2026Test")
        conn.execute(text("""
            INSERT INTO users (id, email, username, password, "fullName", "phoneNumber", "roleId", "isActive", "createdAt", "updatedAt")
            VALUES (1, 'admin.test@netpack.com', 'admin.test', :pw, 'System Administrator', '+977-9801000001', 1, true, NOW(), NOW())
        """), {"pw": admin_pass})

        # B. 2 Pickup Accounts (Riders)
        rider_pass = get_password_hash("Rider@2026Test")
        conn.execute(text("""
            INSERT INTO users (id, email, username, password, "fullName", "phoneNumber", "roleId", "isActive", "createdAt", "updatedAt")
            VALUES 
            (2, 'rider1.test@netpack.com', 'rider1.test', :pw, 'Rider One', '+977-9801000002', 4, true, NOW(), NOW()),
            (3, 'rider2.test@netpack.com', 'rider2.test', :pw, 'Rider Two', '+977-9801000003', 4, true, NOW(), NOW())
        """), {"pw": rider_pass})

        # C. 1 Operations Account
        ops_pass = get_password_hash("Ops@2026Test")
        conn.execute(text("""
            INSERT INTO users (id, email, username, password, "fullName", "phoneNumber", "roleId", "isActive", "createdAt", "updatedAt")
            VALUES (4, 'ops.test@netpack.com', 'ops.test', :pw, 'Operations Coordinator', '+977-9801000004', 5, true, NOW(), NOW())
        """), {"pw": ops_pass})

        # D. 1 CSD Account
        csd_pass = get_password_hash("CSD@2026Test")
        conn.execute(text("""
            INSERT INTO users (id, email, username, password, "fullName", "phoneNumber", "roleId", "isActive", "createdAt", "updatedAt")
            VALUES (5, 'csd.test@netpack.com', 'csd.test', :pw, 'Customer Service Representative', '+977-9801000005', 2, true, NOW(), NOW())
        """), {"pw": csd_pass})

        # E. 3 Customer Accounts (Both in users and customers tables)
        cust_pass = get_password_hash("Cust@2026Test")
        customer_specs = [
            (6, 1, 'customer1.test@gmail.com', 'customer1.test', 'Aarav Sharma', '+977-9841000001', 'Kathmandu', 'Thamel, Ward 26'),
            (7, 2, 'customer2.test@gmail.com', 'customer2.test', 'Pooja Thapa', '+977-9841000002', 'Pokhara', 'Lakeside, Ward 6'),
            (8, 3, 'customer3.test@gmail.com', 'customer3.test', 'Bikash Adhikari', '+977-9841000003', 'Lalitpur', 'Jhamsikhel, Ward 3'),
        ]

        for u_id, c_id, email, username, name, phone, city, addr in customer_specs:
            conn.execute(text("""
                INSERT INTO users (id, email, username, password, "fullName", "phoneNumber", "roleId", "isActive", city, address1, "countryId", "createdAt", "updatedAt")
                VALUES (:uid, :email, :username, :pw, :name, :phone, 6, true, :city, :addr, 194, NOW(), NOW())
            """), {
                "uid": u_id,
                "email": email,
                "username": username,
                "pw": cust_pass,
                "name": name,
                "phone": phone,
                "city": city,
                "addr": addr
            })

            conn.execute(text("""
                INSERT INTO customers (id, name, email, phone, password, "countryId", city, address1, "userId", "createdAt", "updatedAt")
                VALUES (:cid, :name, :email, :phone, :pw, 194, :city, :addr, :uid, NOW(), NOW())
            """), {
                "cid": c_id,
                "name": name,
                "email": email,
                "phone": phone,
                "pw": cust_pass,
                "city": city,
                "addr": addr,
                "uid": u_id
            })

        # Update sequences
        conn.execute(text("SELECT setval(pg_get_serial_sequence('users', 'id'), 8, true);"))
        conn.execute(text("SELECT setval(pg_get_serial_sequence('customers', 'id'), 3, true);"))

    print("[SUCCESS] Database cleaned (including customs manifest hubs) and 8 test accounts created successfully!")

if __name__ == "__main__":
    main()
