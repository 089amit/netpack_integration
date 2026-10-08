from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import config
from database import engine, Base, run_auto_migrations
import models # Ensure all models are registered

import time

def init_db_with_retry(max_retries=10, delay=2):
    """Retries connecting to database on container boot (handles cloud Postgres startup delay)."""
    for attempt in range(1, max_retries + 1):
        try:
            print(f"[Database] Synchronizing schema (attempt {attempt}/{max_retries})...")
            Base.metadata.create_all(bind=engine)
            run_auto_migrations(engine)
            print("[Database] Schema synchronized successfully.")
            
            # Automatically seed baseline roles, default admin, rider, and shipping zones if absent
            try:
                from seed import seed_database
                seed_database()
            except Exception as _seed_err:
                print(f"[Startup Warning] Automatic database seed check: {_seed_err}")

            # Auto-restore data from persistent snapshot if running on fresh container
            try:
                from backup_restore_service import restore_database_backup_if_empty
                restore_database_backup_if_empty()
            except Exception as _restore_err:
                print(f"[Startup Warning] Automatic database restore check: {_restore_err}")
                
            return True
        except Exception as e:
            print(f"[Database Warning] Connection attempt {attempt} failed: {e}")
            if attempt == max_retries:
                print("[Database Error] Could not connect to database after max retries. Starting FastAPI anyway to allow diagnostics.")
                return False
            time.sleep(delay)
    return False

import os
if os.getenv("RUN_DB_INIT") == "1":
    init_db_with_retry()
else:
    print("[Database] Schema ready. Instant cold start enabled.")


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

# Mount uploaded files safely
try:
    if not config.UPLOADS_DIR.exists():
        config.UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(config.UPLOADS_DIR)), name="uploads")
except Exception as _mount_err:
    print(f"[Warning] Could not mount /uploads directory: {_mount_err}")

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
    website_content,
    surcharges,
    forex
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
app.include_router(surcharges.router)
app.include_router(forex.router)

@app.on_event("shutdown")
def on_shutdown_backup():
    try:
        from backup_restore_service import create_database_backup
        create_database_backup()
    except Exception as e:
        print(f"[Shutdown Warning] Failed writing backup snapshot: {e}")

# Database snapshot export endpoint
@app.get("/api/admin/backup-database", tags=["Admin"])
def export_database_snapshot():
    try:
        from backup_restore_service import create_database_backup, LATEST_BACKUP_PATH
        path_str = create_database_backup()
        return {"status": "success", "message": "Database snapshotted successfully", "file": path_str}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Custom hook router for future Python project integrations
@app.get("/api/integrations/status", tags=["Integrations"])
def integration_status():
    return {
        "status": "ready",
        "message": "Python integration layer ready. Add your custom Python models, pipelines, or ML modules here.",
        "backend": "FastAPI (Python 3.14)"
    }

# ─── Legacy & PWA Root Aliases ───────────────────────────────────────────────
from fastapi import BackgroundTasks, Depends
from sqlalchemy.orm import Session
from database import get_db

@app.post("/api/auth/login", tags=["Auth Aliases"])
def root_alias_auth_login(payload: admin.LoginRequest, db: Session = Depends(get_db)):
    return admin.login(payload, db)

@app.post("/api/auth/customer-login", tags=["Customer Portal Aliases"])
def root_alias_customer_login(payload: customer_portal.CustomerLoginRequest, db: Session = Depends(get_db)):
    return customer_portal.customer_login(payload, db)

@app.post("/api/bookings", tags=["Customer Portal Aliases"])
def root_alias_create_booking(
    payload: customer_portal.CustomerEnquiryCreateRequest,
    background_tasks: BackgroundTasks,
    current_customer: models.Customer = Depends(customer_portal.get_current_customer),
    db: Session = Depends(get_db)
):
    return customer_portal.create_customer_enquiry(payload, background_tasks, current_customer, db)

@app.get("/api/bookings/my", tags=["Customer Portal Aliases"])
def root_alias_my_bookings(
    current_customer: models.Customer = Depends(customer_portal.get_current_customer),
    db: Session = Depends(get_db)
):
    return customer_portal.get_customer_shipments(current_customer, db)

@app.post("/api/auth/reset-password", tags=["Auth Aliases"])
def root_alias_reset_password(payload: admin.ResetPasswordRequest, db: Session = Depends(get_db)):
    return admin.reset_password(payload, db)

@app.post("/api/auth/forgot-password", tags=["Auth Aliases"])
def root_alias_forgot_password(payload: admin.ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    return admin.forgot_password(payload, background_tasks, db)

# ─── Mobile APK Distribution Endpoints ──────────────────────────────────────────
BUILD_APK_DIR = config.BASE_DIR.parent / "build-apk"

@app.get("/download/customer.apk", tags=["Mobile Apps"])
def download_customer_apk():
    apk_file = BUILD_APK_DIR / "Netpack-Customer.apk"
    if apk_file.exists():
        return FileResponse(
            str(apk_file),
            media_type="application/vnd.android.package-archive",
            filename="Netpack-Customer.apk"
        )
    raise HTTPException(status_code=404, detail="Customer APK not found. Please build it first.")

@app.get("/download/rider.apk", tags=["Mobile Apps"])
def download_rider_apk():
    apk_file = BUILD_APK_DIR / "Netpack-Rider.apk"
    if apk_file.exists():
        return FileResponse(
            str(apk_file),
            media_type="application/vnd.android.package-archive",
            filename="Netpack-Rider.apk"
        )
    raise HTTPException(status_code=404, detail="Rider APK not found. Please build it first.")

@app.get("/download", response_class=HTMLResponse, tags=["Mobile Apps"])
def download_portal():
    customer_apk = BUILD_APK_DIR / "Netpack-Customer.apk"
    rider_apk = BUILD_APK_DIR / "Netpack-Rider.apk"
    cust_size = f"{customer_apk.stat().st_size / 1024:.1f} KB" if customer_apk.exists() else "Ready"
    rider_size = f"{rider_apk.stat().st_size / 1024:.1f} KB" if rider_apk.exists() else "Ready"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NetPack Logistics - Mobile Apps Download</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
        body {{ background: #0D1B2A; color: #FFFFFF; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; }}
        .card {{ background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(16px); border-radius: 20px; max-width: 480px; width: 100%; padding: 32px 24px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }}
        h1 {{ font-size: 24px; font-weight: 800; margin-bottom: 8px; color: #FFFFFF; }}
        p.subtitle {{ font-size: 14px; color: #94A3B8; margin-bottom: 28px; line-height: 1.5; }}
        .btn-group {{ display: flex; flex-direction: column; gap: 14px; }}
        .btn {{ display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-radius: 14px; text-decoration: none; font-weight: 600; font-size: 15px; transition: all 0.2s; }}
        .btn-customer {{ background: #F59E0B; color: #0D1B2A; }}
        .btn-customer:hover {{ background: #D97706; }}
        .btn-rider {{ background: #1E293B; color: #FFFFFF; border: 1px solid rgba(255,255,255,0.2); }}
        .btn-rider:hover {{ background: #334155; }}
        .badge {{ font-size: 11px; padding: 4px 8px; border-radius: 8px; font-weight: 700; background: rgba(0,0,0,0.15); }}
        .btn-rider .badge {{ background: rgba(255,255,255,0.15); }}
        .info-box {{ margin-top: 24px; padding: 16px; background: rgba(245,158,11,0.08); border: 1px dashed rgba(245,158,11,0.3); border-radius: 12px; text-align: left; font-size: 13px; color: #FCD34D; line-height: 1.6; }}
        .info-box strong {{ color: #F59E0B; }}
    </style>
</head>
<body>
    <div class="card">
        <h1>NetPack Logistics</h1>
        <p class="subtitle">Official Android Testing Apps with background push alerts and verified warehouse weighing.</p>
        <div class="btn-group">
            <a href="/download/customer.apk" class="btn btn-customer">
                <span>📦 Download Customer App</span>
                <span class="badge">{cust_size}</span>
            </a>
            <a href="/download/rider.apk" class="btn btn-rider">
                <span>🚴 Download Rider Dispatch</span>
                <span class="badge">{rider_size}</span>
            </a>
        </div>
        <div class="info-box">
            <strong>🔔 Background Notifications Active:</strong> Both apps automatically check for shipment updates and new pickup dispatch orders even when closed or in the background. Grant <em>Notifications</em> permission on first launch!
        </div>
    </div>
</body>
</html>"""
    return HTMLResponse(content=html)

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
        if full_path.startswith("pickup-pwa"):
            index_path = FRONTEND_DIST / "index.html"
            try:
                html_content = index_path.read_text(encoding="utf-8")
                html_content = html_content.replace('/manifest.webmanifest', '/manifest-pickup.webmanifest')
                html_content = html_content.replace('<title>Netpack Admin</title>', '<title>Netpack Rider Dispatch</title>')
                html_content = html_content.replace('content="Netpack"', 'content="Netpack Rider"')
                return HTMLResponse(content=html_content)
            except Exception:
                return FileResponse(index_path)

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
