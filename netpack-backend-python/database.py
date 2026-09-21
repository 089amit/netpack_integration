from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from config import DATABASE_URL

connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

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
                print(f"[Migration Warning] Enquiries column check: {e}")

        # 1b. Add trackingMode to shipments table if needed
        if "shipments" in table_names:
            try:
                existing_ship_cols = {col["name"] for col in inspector.get_columns("shipments")}
                if "trackingMode" not in existing_ship_cols:
                    conn.execute(sa.text("ALTER TABLE shipments ADD COLUMN trackingMode VARCHAR(20) DEFAULT 'MANUAL'"))
                conn.commit()
            except Exception as e:
                print(f"[Migration Warning] Shipments column check: {e}")

        # 1c. Add photoUrl to customers table if needed
        if "customers" in table_names:
            try:
                existing_cust_cols = {col["name"] for col in inspector.get_columns("customers")}
                if "photoUrl" not in existing_cust_cols:
                    conn.execute(sa.text("ALTER TABLE customers ADD COLUMN photoUrl VARCHAR(500)"))
                conn.commit()
            except Exception as e:
                print(f"[Migration Warning] Customers column check: {e}")

        # 2. Ensure PICKUP role exists
        if "roles" in table_names:
            try:
                r = conn.execute(sa.text("SELECT id FROM roles WHERE name = 'PICKUP'")).fetchone()
                if not r:
                    conn.execute(
                        sa.text("INSERT INTO roles (name, createdAt, updatedAt) VALUES ('PICKUP', :now, :now)"),
                        {"now": now_dt}
                    )
                    conn.commit()
                    print("[Migration] Added 'PICKUP' role to roles table.")
            except Exception as e:
                print(f"[Migration Warning] Role check: {e}")

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
                print(f"[Migration Warning] User-to-customer sync check: {e}")
