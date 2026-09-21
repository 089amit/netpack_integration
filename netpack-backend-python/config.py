import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
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

# SQLite by default for zero-config local operation; PostgreSQL when on Railway
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'netpack.db'}")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    # SQLAlchemy 2.0 requires postgresql:// instead of legacy postgres://
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

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

# Modern HTTPS Email API Keys (Bypasses Railway/cloud port 25/465/587 firewall blocks)
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "")
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")

# TrackingMore Integration (Unified Courier & Airline Air Cargo Tracking)
TRACKINGMORE_API_KEY = os.getenv("TRACKINGMORE_API_KEY", "")
TRACKINGMORE_WEBHOOK_SECRET = os.getenv("TRACKINGMORE_WEBHOOK_SECRET", "")

