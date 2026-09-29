import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Check for persistent volume mount (e.g. Railway volume /data or custom PERSISTENT_DATA_DIR)
# This prevents data loss across rebuilds and redeployments on containerized platforms!
PERSISTENT_ENV_DIR = os.getenv("PERSISTENT_DATA_DIR")
if PERSISTENT_ENV_DIR:
    DATA_DIR = Path(PERSISTENT_ENV_DIR).resolve()
elif os.path.isdir("/data") and os.access("/data", os.W_OK):
    DATA_DIR = Path("/data").resolve()
else:
    DATA_DIR = BASE_DIR

DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR = DATA_DIR / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Load environment variables from .env file if present
ENV_FILE = BASE_DIR / ".env"
if ENV_FILE.exists():
    try:
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip().strip("'\""))
    except Exception as e:
        print(f"Warning loading .env: {e}")

PORT = int(os.getenv("PORT", 8000))
HOST = os.getenv("HOST", "0.0.0.0")
NODE_ENV = os.getenv("NODE_ENV", "development")

# Persistent Database URL:
# 1. Cloud PostgreSQL (Railway / Supabase / Neon / Render) takes highest priority when set
# Checks DATABASE_URL, DATABASE_PRIVATE_URL, POSTGRES_URL, or discrete POSTGRES_* environment variables
raw_db_url = (
    os.getenv("DATABASE_URL")
    or os.getenv("DATABASE_PRIVATE_URL")
    or os.getenv("DATABASE_PUBLIC_URL")
    or os.getenv("POSTGRES_URL")
    or os.getenv("POSTGRESQL_URL")
)

if not raw_db_url and os.getenv("POSTGRES_HOST") and os.getenv("POSTGRES_PASSWORD"):
    pg_user = os.getenv("POSTGRES_USER", "postgres")
    pg_pass = os.getenv("POSTGRES_PASSWORD", "")
    pg_host = os.getenv("POSTGRES_HOST", "localhost")
    pg_port = os.getenv("POSTGRES_PORT", "5432")
    pg_db = os.getenv("POSTGRES_DB", "railway")
    raw_db_url = f"postgresql://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_db}"

if raw_db_url:
    DATABASE_URL = raw_db_url.strip()
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
    elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
    print(f"[Database] Configured PostgreSQL database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else 'connected'}")
else:
    DEFAULT_SQLITE_PATH = DATA_DIR / "netpack.db"
    DATABASE_URL = f"sqlite:///{DEFAULT_SQLITE_PATH}"
    print(f"[Database] Using SQLite at: {DEFAULT_SQLITE_PATH}")

JWT_SECRET = os.getenv("JWT_SECRET", "netpack_customer_jwt_secret_key_2026")
JWT_ADMIN_SECRET = os.getenv("JWT_ADMIN_SECRET", "netpack_admin_jwt_secret_key_2026")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Frontend base URL for email links and CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8000").rstrip("/")

# SMTP Email Configuration (Gmail, Google Workspace, Brevo, SendGrid, Amazon SES, etc.)
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER", os.getenv("EMAIL_USER", ""))
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", os.getenv("EMAIL_PASSWORD", ""))
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", os.getenv("SMTP_USER", "info@netpacklogistic.com"))
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "NetPack Logistics")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "True").lower() in ("true", "1", "yes")
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "False").lower() in ("true", "1", "yes")

EMAIL_USER = SMTP_USER
EMAIL_PASSWORD = SMTP_PASSWORD

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "")
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_FROM_EMAIL = os.getenv("BREVO_FROM_EMAIL", "")

# TrackingMore Integration (Unified Courier & Airline Air Cargo Tracking)
TRACKINGMORE_API_KEY = os.getenv("TRACKINGMORE_API_KEY", "")
TRACKINGMORE_WEBHOOK_SECRET = os.getenv("TRACKINGMORE_WEBHOOK_SECRET", "")

