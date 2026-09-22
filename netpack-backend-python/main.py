from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import config
from database import engine, Base, run_auto_migrations
import models # Ensure all models are registered

# Create database tables automatically and apply migrations
Base.metadata.create_all(bind=engine)
run_auto_migrations(engine)

# Automatically seed baseline roles, default admin, rider, and shipping zones if absent
try:
    from seed import seed_database
    seed_database()
except Exception as _seed_err:
    print(f"[Startup Warning] Automatic database seed check: {_seed_err}")


app = FastAPI(
    title="NetPack Logistics API (Python)",
    description="Enterprise Logistics & Airway Bill Integration API built with FastAPI and SQLite",
    version="1.0.0"
)

# CORS configuration - allow React admin frontend, localhost, network IP and mobile clients
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploaded files
app.mount("/uploads", StaticFiles(directory=str(config.UPLOADS_DIR)), name="uploads")

# Import and register routers
from routers import (
    admin,
    user_roles,
    enquiry,
    shipments,
    mawbs,
    manifest,
    rate,
    location,
    customer,
    agents,
    forwarding,
    analytics,
    policies,
    notifications,
    email_sender,
    tracking,
    custom_manifest,
    pickup,
    customer_portal,
    website_content
)

app.include_router(admin.router)
app.include_router(user_roles.router)
app.include_router(enquiry.router)
app.include_router(pickup.router)
app.include_router(shipments.router)
app.include_router(mawbs.router)
app.include_router(manifest.router)
app.include_router(rate.router)
app.include_router(location.router)
app.include_router(customer.router)
app.include_router(customer_portal.router)
app.include_router(agents.router)
app.include_router(forwarding.router)
app.include_router(analytics.router)
app.include_router(policies.router)
app.include_router(notifications.router)
app.include_router(email_sender.router)
app.include_router(tracking.router)
app.include_router(custom_manifest.router)
app.include_router(website_content.router)

# Custom hook router for future Python project integrations
@app.get("/api/integrations/status", tags=["Integrations"])
def integration_status():
    return {
        "status": "ready",
        "message": "Python integration layer ready. Add your custom Python models, pipelines, or ML modules here.",
        "backend": "FastAPI (Python 3.14)"
    }

# ─── Production Frontend SPA & Static File Serving (Single Platform) ─────────
FRONTEND_DIST = None
possible_dist_dirs = [
    config.BASE_DIR / "static",
    config.BASE_DIR / "dist",
    config.BASE_DIR.parent / "react-netpack-admin-main" / "react-netpack-admin-main" / "dist",
]
for p in possible_dist_dirs:
    if p.exists() and (p / "index.html").exists():
        FRONTEND_DIST = p
        break

if FRONTEND_DIST:
    # Mount hashed assets directory
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="frontend-assets")

    # SPA catch-all route for all pages and direct asset requests
    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_frontend(full_path: str):
        # Prevent intercepting API, uploads, and docs routes
        if full_path.startswith("api/") or full_path.startswith("uploads/") or full_path in ("docs", "redoc", "openapi.json"):
            return FileResponse(FRONTEND_DIST / "index.html")

        # Serve exact file if it exists (e.g. sw-pickup.js, manifest.webmanifest, favicon.ico, images)
        target_file = FRONTEND_DIST / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)

        # Fallback to index.html for client-side routing (/pickup-pwa, /tracking/NP..., /shipment, etc.)
        return FileResponse(FRONTEND_DIST / "index.html")
else:
    @app.get("/", tags=["Health"])
    def root():
        return {
            "message": "NetPack Logistics Python API is running",
            "docs": "/docs",
            "redoc": "/redoc",
            "version": "1.0.0"
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=config.HOST, port=config.PORT, reload=True)
