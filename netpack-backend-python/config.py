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
elif os.getenv("VERCEL") or os.path.exists("/tmp"):
    DATA_DIR = Path("/tmp").resolve()
else:
    DATA_DIR = BASE_DIR

try:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass

UPLOADS_DIR = DATA_DIR / "uploads"
try:
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass

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
# 1. MySQL (Primary): checks MYSQL_URL, DATABASE_URL, or discrete MYSQL_* environment variables
# 2. Cloud PostgreSQL / SQLite (fallback compatibility)
raw_db_url = (
    os.getenv("MYSQL_URL")
    or os.getenv("MYSQL_PRIVATE_URL")
    or os.getenv("MYSQL_PUBLIC_URL")
    or os.getenv("DATABASE_URL")
    or os.getenv("DATABASE_PRIVATE_URL")
    or os.getenv("DATABASE_PUBLIC_URL")
    or os.getenv("POSTGRES_URL")
    or os.getenv("POSTGRESQL_URL")
)

# Check discrete MySQL environment variables (standard across local dev, cPanel, Docker, Railway, AWS RDS)
mysql_host = os.getenv("MYSQL_HOST") or os.getenv("MYSQLHOST")
mysql_user = os.getenv("MYSQL_USER") or os.getenv("MYSQLUSER") or "root"
mysql_pass = os.getenv("MYSQL_PASSWORD") or os.getenv("MYSQL_PASS") or os.getenv("MYSQLPASSWORD") or ""
mysql_port = os.getenv("MYSQL_PORT") or os.getenv("MYSQLPORT") or "3306"
mysql_db = os.getenv("MYSQL_DATABASE") or os.getenv("MYSQL_DB") or os.getenv("MYSQLDATABASE") or "netpack"

if not raw_db_url and (mysql_host or os.getenv("MYSQL_PASSWORD") is not None or os.getenv("MYSQL_DATABASE")):
    host = mysql_host or "localhost"
    raw_db_url = f"mysql+pymysql://{mysql_user}:{mysql_pass}@{host}:{mysql_port}/{mysql_db}?charset=utf8mb4"

# PostgreSQL discrete variables fallback
if not raw_db_url and os.getenv("POSTGRES_HOST") and os.getenv("POSTGRES_PASSWORD"):
    pg_user = os.getenv("POSTGRES_USER", "postgres")
    pg_pass = os.getenv("POSTGRES_PASSWORD", "")
    pg_host = os.getenv("POSTGRES_HOST", "localhost")
    pg_port = os.getenv("POSTGRES_PORT", "5432")
    pg_db = os.getenv("POSTGRES_DB", "railway")
    raw_db_url = f"postgresql://{pg_user}:{pg_pass}@{pg_host}:{pg_port}/{pg_db}"

# Default database when none is explicitly provided:
# Default to MySQL (e.g. mysql+pymysql://root:@localhost:3306/netpack?charset=utf8mb4),
# or SQLite if USE_SQLITE is explicitly enabled.
if not raw_db_url:
    if os.getenv("USE_SQLITE", "false").lower() in ("1", "true", "yes"):
        DEFAULT_SQLITE_PATH = DATA_DIR / "netpack.db"
        raw_db_url = f"sqlite:///{DEFAULT_SQLITE_PATH}"
    else:
        raw_db_url = f"mysql+pymysql://{mysql_user}:{mysql_pass}@localhost:{mysql_port}/{mysql_db}?charset=utf8mb4"

import secrets

if raw_db_url:
    DATABASE_URL = raw_db_url.strip()
    if DATABASE_URL.startswith("mysql://"):
        DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)
    elif DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
    elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

    # Ensure charset=utf8mb4 for MySQL connections
    if "mysql" in DATABASE_URL and "charset=" not in DATABASE_URL:
        separator = "&" if "?" in DATABASE_URL else "?"
        DATABASE_URL = f"{DATABASE_URL}{separator}charset=utf8mb4"

    # Ensure SSL is enforced for remote cloud PostgreSQL connections
    if ("postgresql" in DATABASE_URL or "postgres" in DATABASE_URL) and "sslmode=" not in DATABASE_URL and not any(h in DATABASE_URL for h in ("localhost", "127.0.0.1")):
        separator = "&" if "?" in DATABASE_URL else "?"
        DATABASE_URL = f"{DATABASE_URL}{separator}sslmode=require"

    if "mysql" in DATABASE_URL:
        db_type = "MySQL"
    elif "postgresql" in DATABASE_URL or "postgres" in DATABASE_URL:
        db_type = "PostgreSQL"
    else:
        db_type = "SQLite"

    masked_target = DATABASE_URL.split("@")[-1] if "@" in DATABASE_URL else DATABASE_URL
    print(f"[Database] Configured {db_type} database: {masked_target}")
else:
    DEFAULT_SQLITE_PATH = DATA_DIR / "netpack.db"
    DATABASE_URL = f"sqlite:///{DEFAULT_SQLITE_PATH}"
    print(f"[Database] Using SQLite at: {DEFAULT_SQLITE_PATH}")

# Secure JWT configuration: prohibit hardcoded fallback secrets in production environments
is_prod = os.getenv("NODE_ENV") == "production" or os.getenv("VERCEL")
_jwt_env = os.getenv("JWT_SECRET")
if _jwt_env and _jwt_env.strip():
    JWT_SECRET = _jwt_env.strip()
elif is_prod:
    # Generate ephemeral cryptographically secure random key if missing in production
    print("[SECURITY WARNING] JWT_SECRET not found in environment variables. Generating cryptographically secure ephemeral secret.")
    JWT_SECRET = secrets.token_hex(32)
else:
    JWT_SECRET = "netpack_customer_jwt_secret_key_2026_dev_only"

_jwt_admin_env = os.getenv("JWT_ADMIN_SECRET")
if _jwt_admin_env and _jwt_admin_env.strip():
    JWT_ADMIN_SECRET = _jwt_admin_env.strip()
elif is_prod:
    print("[SECURITY WARNING] JWT_ADMIN_SECRET not found in environment variables. Generating cryptographically secure ephemeral secret.")
    JWT_ADMIN_SECRET = secrets.token_hex(32)
else:
    JWT_ADMIN_SECRET = "netpack_admin_jwt_secret_key_2026_dev_only"

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Frontend base URL for email links and CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:8000").rstrip("/")

# SMTP Email Configuration (Zoho Mail, Google Workspace, Gmail, Brevo, SendGrid, etc.)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.zoho.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 465))
SMTP_USER = os.getenv("SMTP_USER", os.getenv("EMAIL_USER", "noreply@netpacklogistic.com"))
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", os.getenv("EMAIL_PASSWORD", ""))
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", os.getenv("SMTP_USER", "noreply@netpacklogistic.com"))
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "NetPack Logistic")
SMTP_REPLY_TO = os.getenv("SMTP_REPLY_TO", "info@netpacklogistic.com")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "False").lower() in ("true", "1", "yes")
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "True").lower() in ("true", "1", "yes")

EMAIL_USER = SMTP_USER
EMAIL_PASSWORD = SMTP_PASSWORD

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "")
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_FROM_EMAIL = os.getenv("BREVO_FROM_EMAIL", "")

# TrackingMore Integration (Unified Courier & Airline Air Cargo Tracking)
TRACKINGMORE_API_KEY = os.getenv("TRACKINGMORE_API_KEY", "")
TRACKINGMORE_WEBHOOK_SECRET = os.getenv("TRACKINGMORE_WEBHOOK_SECRET", "")

# Google Maps Platform (Address Verification & Geocoding)
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY", "")

