from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging
import time

from app.database import Base, engine, get_db, reset_connection_pool, check_pool_status, test_connection

# Controllers
from app.controllers import (
    auth_controller,
    notification_controller,
    email_controller,
    registration_controller,
    agreement_controller,
    audit_controller,
    partners_controller,
    document_controller,
)

# Models and Services
from app.models.notification import Notification  
from app.services.nlp_extraction_service import NlpExtractionService
from app.services.document_processing_service import DocumentProcessingService

# Logger
logger = logging.getLogger("uvicorn.error")

# ---------------------------
# FastAPI Initialization
# ---------------------------
app = FastAPI(
    title="Globalinked API",
    description="Monitoring System for the OIA",
    version="1.0.0",
)

# ---------------------------
# CORS Middleware
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://globalinked.systems",
        "https://www.globalinked.systems",
        "https://api.globalinked.systems",
        "http://localhost:3000",
    ],
    allow_origin_regex=r"https://.*\.globalinked\.systems",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Include Routers
# ---------------------------
app.include_router(auth_controller.router)
app.include_router(agreement_controller.router)
app.include_router(notification_controller.router)
app.include_router(email_controller.router)
app.include_router(registration_controller.router)
app.include_router(partners_controller.router)
app.include_router(audit_controller.router)
app.include_router(document_controller.router)

# ---------------------------
# Initialize NLP & Document Services
# ---------------------------
if not hasattr(app.state, "doc_processing_service"):
    app.state.doc_processing_service = DocumentProcessingService()

if not hasattr(app.state, "nlp_service"):
    app.state.nlp_service = NlpExtractionService(
        document_processing_service=app.state.doc_processing_service
    )

# ---------------------------
# Admin & Diagnostics Endpoints
# ---------------------------
@app.get("/admin/pool-status")
async def admin_pool_status():
    """Check database connection pool status."""
    return check_pool_status()


@app.post("/admin/reset-pool")
async def admin_reset_pool():
    """Emergency reset of database connection pool."""
    try:
        result = reset_connection_pool()
        return result
    except Exception as e:
        logger.error(f"Pool reset failed: {e}")
        raise HTTPException(status_code=500, detail=f"Pool reset failed: {str(e)}")


@app.get("/admin/db-health")
async def admin_db_health():
    """Test database connectivity (with retries)."""
    for attempt in range(3):
        try:
            return test_connection()
        except Exception as e:
            logger.warning(f"DB health check attempt {attempt + 1} failed: {e}")
            time.sleep(2)
    raise HTTPException(status_code=503, detail="Database unreachable after 3 retries")


@app.get("/admin/performance-test")
async def performance_test(db: Session = Depends(get_db)):
    """Quick database performance test."""
    results = {}

    # Test 1: Simple query
    start = time.time()
    try:
        result = db.execute(text("SELECT COUNT(*) FROM agreements")).scalar()
        results["count_query"] = {"time": round(time.time() - start, 3), "count": result}
    except Exception as e:
        results["count_query"] = {"error": str(e)}

    # Test 2: Pool status
    results["pool_status"] = check_pool_status()

    return results

# ---------------------------
# Startup / Shutdown Events
# ---------------------------
@app.on_event("startup")
def on_startup():
    """Initialize scheduler, preload NLP model, and verify DB connectivity."""
    try:
       # from app.scheduler import start_scheduler
       # start_scheduler()
        logger.info("Scheduler started successfully.")
    except Exception as e:
        logger.warning(f"Scheduler failed to start: {e}")
    # Preload QA model
    try:
        svc = getattr(app.state, "nlp_service", None)
        if svc is None:
            app.state.nlp_service = NlpExtractionService(
                document_processing_service=app.state.doc_processing_service
            )
            svc = app.state.nlp_service

        if hasattr(svc, "_ensure_qa"):
            svc._ensure_qa()
        info = getattr(svc, "qa_info", lambda: {})()
        logger.info(
            "QA ready: model=%s device=%s chunk=%s overlap=%s",
            info.get("model", "?"),
            info.get("device", "?"),
            info.get("chunk_chars", "?"),
            info.get("overlap", "?"),
        )
    except Exception as e:
        logger.exception(f"Failed to preload QA model: {e}")

    # DB health check at startup
    try:
        db_status = test_connection()
        logger.info(f"Database startup check: {db_status}")
    except Exception as e:
        logger.error(f"Database connection failed at startup: {e}")


@app.on_event("shutdown")
def on_shutdown():
    """Cleanly shut down scheduler."""
    try:
        from app.scheduler import shutdown_scheduler
        shutdown_scheduler()
        logger.info("Scheduler stopped successfully.")
    except Exception as e:
        logger.warning(f"Scheduler shutdown issue: {e}")

# ---------------------------
# NLP Health Endpoint
# ---------------------------
@app.get("/health/qa")
def qa_health():
    """Check QA model readiness."""
    svc = getattr(app.state, "nlp_service", None)
    ready = False
    info = {}
    try:
        if svc and hasattr(svc, "is_qa_ready"):
            ready = bool(svc.is_qa_ready())
        elif svc:
            ready = True  # fallback assumption
        if ready and hasattr(svc, "qa_info"):
            info = svc.qa_info()
    except Exception:
        ready = False
        info = {}
    return {"ready": ready, "info": info}
