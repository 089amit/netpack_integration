import sys
import os
from pathlib import Path

# Add netpack-backend-python directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "netpack-backend-python"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Configure serverless flags for fast cold start
os.environ.setdefault("VERCEL", "1")
os.environ.setdefault("SKIP_DB_INIT", "1")

# Import the FastAPI application
from main import app

# Health check endpoint for Vercel
@app.get("/api/health", tags=["Health"])
def vercel_health():
    return {
        "status": "healthy",
        "platform": "Vercel Serverless",
        "database": "Neon PostgreSQL"
    }
