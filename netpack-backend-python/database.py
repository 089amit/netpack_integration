from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import DATABASE_URL

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

# Production engine configuration:
# For PostgreSQL: enable pre-ping to self-heal dropped cloud connections, pool recycle, and sizing
engine_kwargs = {"echo": False, "connect_args": connect_args}
if "postgresql" in DATABASE_URL or "postgres" in DATABASE_URL:
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 10,
        "max_overflow": 20
    })

engine = create_engine(DATABASE_URL, **engine_kwargs)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def run_auto_migrations(target_engine):
    """
    Safely ensures schema changes, roles, and user-customer linkages
    exist in the database (supports both SQLite and PostgreSQL) on application startup.
    """
    import sqlalchemy as sa
    from datetime import datetime

    inspector = sa.inspect(target_engine)
    table_names = set(inspector.get_table_names())
    now_dt = datetime.utcnow()

    with target_engine.connect() as conn:
        # 1. Add missing columns to enquiries table if needed
        if "enquiries" in table_names:
            try:
                existing_cols = {col["name"] for col in inspector.get_columns("enquiries")}
                new_columns = [
                    ("weightProofImageUrl", "VARCHAR(500)"),
                    ("pickedUpAt", "TIMESTAMP"),
                    ("pickedUpBy", "INTEGER"),
                    ("pickupNotes", "VARCHAR(500)"),
                    ("volumetricWeight", "FLOAT"),
                    ("chargeableWeight", "FLOAT"),
                    ("trackingMode", "VARCHAR(20) DEFAULT 'MANUAL'"),
                    ("isFromCustomer", "BOOLEAN DEFAULT FALSE"),
                    ("isPacked", "BOOLEAN DEFAULT FALSE"),
                    ("packedAt", "TIMESTAMP"),
                    ("pickupRequired", "BOOLEAN DEFAULT TRUE"),
                ]
                for col_name, col_type in new_columns:
                    if col_name not in existing_cols:
                        conn.execute(sa.text(f"ALTER TABLE enquiries ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception as e:
                try:
                    conn.rollback()
                except Exception:
                    pass
                print(f"[Migration Warning] Enquiries column check: {e}")

        # 1b. Add trackingMode to shipments table if needed
        if "shipments" in table_names:
            try:
                existing_ship_cols = {col["name"] for col in inspector.get_columns("shipments")}
                if "trackingMode" not in existing_ship_cols:
                    conn.execute(sa.text("ALTER TABLE shipments ADD COLUMN trackingMode VARCHAR(20) DEFAULT 'MANUAL'"))
                conn.commit()
            except Exception as e:
                try:
                    conn.rollback()
                except Exception:
                    pass
                print(f"[Migration Warning] Shipments column check: {e}")

        # 1c. Add photoUrl to customers table if needed
        if "customers" in table_names:
            try:
                existing_cust_cols = {col["name"] for col in inspector.get_columns("customers")}
                if "photoUrl" not in existing_cust_cols:
                    conn.execute(sa.text("ALTER TABLE customers ADD COLUMN photoUrl VARCHAR(500)"))
                conn.commit()
            except Exception as e:
                try:
                    conn.rollback()
                except Exception:
                    pass
                print(f"[Migration Warning] Customers column check: {e}")

        # 2. Ensure baseline roles exist
        if "roles" in table_names:
            try:
                for r_name in ["ADMIN", "OPERATIONS", "USER", "CUSTOMER", "PICKUP"]:
                    r = conn.execute(sa.text("SELECT id FROM roles WHERE name = :name"), {"name": r_name}).fetchone()
                    if not r:
                        conn.execute(
                            sa.text("INSERT INTO roles (name, createdAt, updatedAt) VALUES (:name, :now, :now)"),
                            {"name": r_name, "now": now_dt}
                        )
                        conn.commit()
                        print(f"[Migration] Added '{r_name}' role to roles table.")
            except Exception as e:
                try:
                    conn.rollback()
                except Exception:
                    pass
                print(f"[Migration Warning] Role check: {e}")

        # 2a. Unify OPERATION and OPERATIONS into single OPERATIONS role
        if "roles" in table_names and "users" in table_names:
            try:
                ops_role = conn.execute(sa.text("SELECT id FROM roles WHERE UPPER(name) = 'OPERATIONS'")).fetchone()
                op_role = conn.execute(sa.text("SELECT id FROM roles WHERE UPPER(name) = 'OPERATION'")).fetchone()
                if op_role:
                    if not ops_role:
                        conn.execute(sa.text("UPDATE roles SET name = 'OPERATIONS' WHERE id = :op_id"), {"op_id": op_role[0]})
                        conn.commit()
                        print("[Migration] Renamed 'OPERATION' role to 'OPERATIONS'.")
                    else:
                        conn.execute(sa.text("UPDATE users SET roleId = :ops_id WHERE roleId = :op_id"), {"ops_id": ops_role[0], "op_id": op_role[0]})
                        conn.execute(sa.text("DELETE FROM roles WHERE id = :op_id"), {"op_id": op_role[0]})
                        conn.commit()
                        print("[Migration] Merged 'OPERATION' into 'OPERATIONS' and removed redundant role.")
            except Exception as e:
                try:
                    conn.rollback()
                except Exception:
                    pass
                print(f"[Migration Warning] Unify OPERATIONS role: {e}")

        # 2b. Automatically correct any accounts that were erroneously assigned ADMIN during public signup
        if "users" in table_names and "roles" in table_names:
            try:
                admin_role = conn.execute(sa.text("SELECT id FROM roles WHERE name = 'ADMIN'")).fetchone()
                user_role = conn.execute(sa.text("SELECT id FROM roles WHERE name = 'USER'")).fetchone()
                if admin_role and user_role:
                    admin_role_id = admin_role[0]
                    user_role_id = user_role[0]
                    conn.execute(sa.text("""
                        UPDATE users 
                        SET roleId = :user_role_id
                        WHERE roleId = :admin_role_id
                          AND LOWER(email) NOT IN ('admin@example.com', 'admin@netpack.com', 'admin@netpacklogistic.com', 'app.netpack@gmail.com', 'kiran.netpack@gmail.com')
                          AND LOWER(email) NOT LIKE '%superadmin%'
                    """), {"user_role_id": user_role_id, "admin_role_id": admin_role_id})
                    # Ensure official NetPack administrators maintain ADMIN role
                    conn.execute(sa.text("""
                        UPDATE users
                        SET roleId = :admin_role_id
                        WHERE LOWER(email) IN ('app.netpack@gmail.com', 'kiran.netpack@gmail.com')
                    """), {"admin_role_id": admin_role_id})
                    conn.commit()
            except Exception as e:
                try:
                    conn.rollback()
                except Exception:
                    pass
                print(f"[Migration Warning] Auto-downgrade accidentally elevated signup users: {e}")

        # 3. Ensure all Users are also present in Customers table
        if "users" in table_names and "customers" in table_names:
            try:
                users = conn.execute(sa.text("SELECT id, fullName, email, phoneNumber, isOrganization, organizationName, address1, city, state, postcode, countryId FROM users")).fetchall()
                for u in users:
                    u_id, u_name, u_email, u_phone, u_is_org, u_org_name, u_addr, u_city, u_state, u_postcode, u_country_id = u
                    c = conn.execute(sa.text("SELECT id FROM customers WHERE userId = :uid OR email = :email"), {"uid": u_id, "email": u_email}).fetchone()
                    if not c:
                        # Get a default country if user has no countryId
                        target_country = u_country_id
                        if not target_country:
                            first_country = conn.execute(sa.text("SELECT id FROM countries LIMIT 1")).fetchone()
                            target_country = first_country[0] if first_country else 1

                        conn.execute(sa.text("""
                            INSERT INTO customers (
                                name, phone, email, isOrganization, organizationName,
                                address1, city, state, countryId, postcode, userId,
                                createdAt, updatedAt
                            ) VALUES (
                                :name, :phone, :email, :isOrg, :orgName,
                                :address1, :city, :state, :countryId, :postcode, :userId,
                                :now, :now
                            )
                        """), {
                            "name": u_name or (u_email.split("@")[0] if u_email else "User"),
                            "phone": u_phone or "+977-00000000",
                            "email": u_email,
                            "isOrg": 1 if u_is_org else 0,
                            "orgName": u_org_name,
                            "address1": u_addr,
                            "city": u_city,
                            "state": u_state,
                            "countryId": target_country,
                            "postcode": u_postcode,
                            "userId": u_id,
                            "now": now_dt
                        })
                        conn.commit()
            except Exception as e:
                try:
                    conn.rollback()
                except Exception:
                    pass
                print(f"[Migration Warning] User-to-customer sync check: {e}")

        # 4. Ensure all 230+ world countries are present in countries table
        if "countries" in table_names:
            try:
                from countries_data import WORLD_COUNTRIES
                existing_country_rows = conn.execute(sa.text("SELECT LOWER(name) FROM countries")).fetchall()
                existing_country_names = {row[0] for row in existing_country_rows}
                new_countries = 0
                for c_item in WORLD_COUNTRIES:
                    c_name = c_item["name"]
                    if c_name.lower() not in existing_country_names:
                        conn.execute(
                            sa.text("INSERT INTO countries (name, boxWeightLimit, isActive) VALUES (:name, :weight, 1)"),
                            {"name": c_name, "weight": c_item.get("boxWeightLimit", 30.0)}
                        )
                        existing_country_names.add(c_name.lower())
                        new_countries += 1
                if new_countries > 0:
                    conn.commit()
                    print(f"[Migration] Seeded {new_countries} new countries into database.")
            except Exception as e:
                try:
                    conn.rollback()
                except Exception:
                    pass
                print(f"[Migration Warning] Countries seeding check: {e}")

        # 5. Ensure baseline accounts for all user roles (Admin, Driver, Courier, Customer)
        if "users" in table_names and "roles" in table_names and "customers" in table_names:
            try:
                from services.auth_service import get_password_hash
                admin_role = conn.execute(sa.text("SELECT id FROM roles WHERE name = 'ADMIN'")).fetchone()
                pickup_role = conn.execute(sa.text("SELECT id FROM roles WHERE name = 'PICKUP'")).fetchone()
                user_role = conn.execute(sa.text("SELECT id FROM roles WHERE name = 'USER'")).fetchone()
                
                # Find Nepal country ID
                nepal_country = conn.execute(sa.text("SELECT id FROM countries WHERE LOWER(name) = 'nepal'")).fetchone()
                nepal_id = nepal_country[0] if nepal_country else 1

                # 5a. Admin Account
                if admin_role:
                    adm = conn.execute(sa.text("SELECT id FROM users WHERE LOWER(email) = 'admin@example.com'")).fetchone()
                    if not adm:
                        conn.execute(sa.text("""
                            INSERT INTO users (email, username, password, fullName, phoneNumber, roleId, isActive, countryId, city, address1, createdAt, updatedAt)
                            VALUES ('admin@example.com', 'admin', :pw, 'System Administrator', '+977-9800000000', :roleId, 1, :countryId, 'Kathmandu', 'Thamel', :now, :now)
                        """), {
                            "pw": get_password_hash("Admin@123"),
                            "roleId": admin_role[0],
                            "countryId": nepal_id,
                            "now": now_dt
                        })
                        conn.commit()
                        print("[Migration] Created baseline Admin account: admin@example.com / Admin@123")

                # 5b. Pickup Rider / Driver Account
                if pickup_role:
                    drv = conn.execute(sa.text("SELECT id FROM users WHERE LOWER(email) = 'driver@netpack.com'")).fetchone()
                    if not drv:
                        conn.execute(sa.text("""
                            INSERT INTO users (email, username, password, fullName, phoneNumber, roleId, isActive, countryId, city, address1, createdAt, updatedAt)
                            VALUES ('driver@netpack.com', 'rider-01', :pw, 'Ram Shrestha (Field Rider)', '+977-9841234567', :roleId, 1, :countryId, 'Kathmandu', 'New Road', :now, :now)
                        """), {
                            "pw": get_password_hash("Driver@123"),
                            "roleId": pickup_role[0],
                            "countryId": nepal_id,
                            "now": now_dt
                        })
                        conn.commit()
                        print("[Migration] Created baseline Driver account: driver@netpack.com / Driver@123")

                # 5c. Cargo Courier / Staff Account
                if user_role:
                    courier = conn.execute(sa.text("SELECT id FROM users WHERE LOWER(email) = 'courier@netpack.com'")).fetchone()
                    if not courier:
                        conn.execute(sa.text("""
                            INSERT INTO users (email, username, password, fullName, phoneNumber, roleId, isActive, countryId, city, address1, createdAt, updatedAt)
                            VALUES ('courier@netpack.com', 'courier-01', :pw, 'Sita Sharma (Express Cargo)', '+977-9851000000', :roleId, 1, :countryId, 'Kathmandu', 'Dillibazar', :now, :now)
                        """), {
                            "pw": get_password_hash("Courier@123"),
                            "roleId": user_role[0],
                            "countryId": nepal_id,
                            "now": now_dt
                        })
                        conn.commit()
                        print("[Migration] Created baseline Courier account: courier@netpack.com / Courier@123")

                # 5d. Customer Account with fully completed profile
                cust = conn.execute(sa.text("SELECT id FROM customers WHERE LOWER(email) = 'customer@netpack.com'")).fetchone()
                if not cust:
                    conn.execute(sa.text("""
                        INSERT INTO customers (name, email, phone, password, address1, address2, city, state, countryId, postcode, createdAt, updatedAt)
                        VALUES ('NetPack Loyal Customer', 'customer@netpack.com', '+977-9812345678', :pw, 'Baluwatar Road, Ward 4', 'Near Embassy', 'Kathmandu', 'Bagmati', :countryId, '44600', :now, :now)
                    """), {
                        "pw": get_password_hash("Customer@123"),
                        "countryId": nepal_id,
                        "now": now_dt
                    })
                    conn.commit()
                    print("[Migration] Created baseline Customer account: customer@netpack.com / Customer@123")

                # 5e. Ensure customer with id=1 exists for walk-in shippers and fallback
                c1 = conn.execute(sa.text("SELECT id FROM customers WHERE id = 1")).fetchone()
                if not c1:
                    conn.execute(sa.text("""
                        INSERT INTO customers (id, name, phone, email, countryId, address1, city, createdAt, updatedAt)
                        VALUES (1, 'NetPack Walk-in / Direct Shipper', '+977-01-5339942', 'walkin@netpacklogistic.com', :countryId, 'Kathmandu Operations HQ', 'Kathmandu', :now, :now)
                    """), {
                        "countryId": nepal_id,
                        "now": now_dt
                    })
                    conn.commit()
                    print("[Migration] Created fallback default customer (id=1) for walk-in shippers.")
            except Exception as e:
                try:
                    conn.rollback()
                except Exception:
                    pass
                print(f"[Migration Warning] Baseline accounts check: {e}")

        # 6. Synchronize all PostgreSQL table sequences to prevent UniqueViolation on newly inserted records
        is_pg = "postgresql" in str(target_engine.url).lower() or "postgres" in str(target_engine.url).lower()
        if is_pg:
            try:
                conn.execute(sa.text("""
                    DO $$
                    DECLARE
                        r RECORD;
                        seq_name TEXT;
                        max_id BIGINT;
                    BEGIN
                        FOR r IN 
                            SELECT table_name 
                            FROM information_schema.tables 
                            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                        LOOP
                            BEGIN
                                seq_name := pg_get_serial_sequence(r.table_name, 'id');
                                IF seq_name IS NOT NULL THEN
                                    EXECUTE format('SELECT COALESCE(MAX(id), 0) + 1 FROM %I', r.table_name) INTO max_id;
                                    EXECUTE format('SELECT setval(%L, %s, false)', seq_name, max_id);
                                END IF;
                            EXCEPTION WHEN OTHERS THEN
                                NULL;
                            END;
                        END LOOP;
                    END $$;
                """))
                conn.commit()
                print("[Migration] Synchronized all PostgreSQL serial sequences to MAX(id) + 1.")
            except Exception as e:
                try:
                    conn.rollback()
                except Exception:
                    pass
                print(f"[Migration Warning] PostgreSQL sequence resync: {e}")
