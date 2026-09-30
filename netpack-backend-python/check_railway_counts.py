import os
import sys
import sqlalchemy as sa

db_url = os.getenv("DATABASE_URL") or (sys.argv[1] if len(sys.argv) > 1 else None)
if not db_url:
    from config import DATABASE_URL as db_url

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+psycopg2://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

engine = sa.create_engine(db_url)
tables = ['agents', 'boxes', 'box_items', 'countries', 'customers', 'enquiries', 'enquiry_items', 'shipments', 'rates', 'area_surcharges', 'roles', 'users']

with engine.connect() as conn:
    for t in tables:
        try:
            cnt = conn.execute(sa.text(f'SELECT COUNT(*) FROM "{t}"')).scalar()
            print(f'{t:<25}: {cnt:>6} rows')
        except Exception as e:
            print(f'{t:<25}: error {e}')
