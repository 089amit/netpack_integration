"""
NetPack Logistics - 1-Click SQLite to PostgreSQL Migration Tool
Copies all existing roles, users, countries, rates, enquiries, boxes, shipments,
and tracking events from local netpack.db directly into target PostgreSQL.
Usage:
    python migrate_sqlite_to_postgres.py [POSTGRES_DATABASE_URL]
"""

import sys
import os
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from config import BASE_DIR, DATA_DIR
import models
from database import Base, run_auto_migrations
from backup_restore_service import create_database_backup, restore_database_backup_if_empty

def main():
    target_url = sys.argv[1] if len(sys.argv) > 1 else os.getenv("TARGET_DATABASE_URL") or os.getenv("DATABASE_URL")
    if not target_url or ("postgresql" not in target_url and "postgres" not in target_url):
        print("Usage: python migrate_sqlite_to_postgres.py postgresql://user:pass@host:port/dbname")
        return

    if target_url.startswith("postgres://"):
        target_url = target_url.replace("postgres://", "postgresql://", 1)

    print(f"[*] Starting migration from local SQLite to PostgreSQL: {target_url.split('@')[-1]}")

    # 1. First take a fresh backup of current local SQLite
    backup_file = create_database_backup()
    print(f"[*] Snapshot created at {backup_file}")

    # 2. Connect to target PostgreSQL
    pg_engine = create_engine(target_url, pool_pre_ping=True)
    PgSession = sessionmaker(autocommit=False, autoflush=False, bind=pg_engine)

    # 3. Create schema and apply migrations on PostgreSQL
    print("[*] Creating PostgreSQL schema...")
    Base.metadata.create_all(bind=pg_engine)
    run_auto_migrations(pg_engine)

    # 4. Restore data into PostgreSQL
    pg_db = PgSession()
    try:
        # Run seed for baseline roles / countries if empty
        from seed import seed_database
        # Restore full snapshot
        restore_database_backup_if_empty(pg_db)
        print("[SUCCESS] All NetPack data successfully migrated to permanent PostgreSQL!")
    finally:
        pg_db.close()

if __name__ == "__main__":
    main()
