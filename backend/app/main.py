from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import Base, engine, get_db, reset_connection_pool, check_pool_status, test_connection
import logging

logger = logging.getLogger("uvicorn.error")

from app.controllers import (
    auth_controller,
    notification_controller,
    email_controller,
    registration_controller,
    agreement_controller,
    audit_controller,
)
from app.controllers import partners_controller
from app.controllers import document_controller
from app.models.notification import Notification  
from app.services.nlp_extraction_service import NlpExtractionService
from app.services.document_processing_service import DocumentProcessingService

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Globalinked API",
    description="Monitoring System for OIA",
    version="1.0.0",
)

origins = [
    "https://globalinked.systems",          # Frontend domain
    "https://www.globalinked.systems",      # Frontend domain with www
    "https://api.globalinked.systems",      # Backend domain, if self-requests occur
    "http://localhost:3000",                # For dev
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(auth_controller.router)
app.include_router(agreement_controller.router)
app.include_router(notification_controller.router)
app.include_router(email_controller.router)
app.include_router(registration_controller.router)
app.include_router(partners_controller.router)
app.include_router(audit_controller.router)
app.include_router(document_controller.router)

# Initialize services
if not hasattr(app.state, "doc_processing_service"):
    app.state.doc_processing_service = DocumentProcessingService()
if not hasattr(app.state, "nlp_service"):
    app.state.nlp_service = NlpExtractionService(
        document_processing_service=app.state.doc_processing_service
    )

# Admin endpoints for pool management
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
        raise HTTPException(status_code=500, detail=f"Pool reset failed: {str(e)}")

@app.get("/admin/db-health")
async def admin_db_health():
    """Test database connectivity."""
    return test_connection()

@app.get("/admin/performance-test")
async def performance_test(db: Session = Depends(get_db)):
    """Quick performance test."""
    import time
    
    results = {}
    
    # Test 1: Simple query
    start = time.time()
    result = db.execute(text("SELECT COUNT(*) FROM agreements")).scalar()
    results["count_query"] = {"time": round(time.time() - start, 3), "count": result}
    
    # Test 2: Pool status
    results["pool_status"] = check_pool_status()
    
    return results

@app.on_event("startup")
def on_startup():
    # Start scheduler
    from app.scheduler import start_scheduler

    start_scheduler()

    # Preload QA once on startup (sync load; will use cache on subsequent runs)
    try:
        if getattr(app.state, "nlp_service", None) is None:
            app.state.nlp_service = NlpExtractionService(
                document_processing_service=app.state.doc_processing_service
            )
        # Ensure the QA pipeline is loaded
        if hasattr(app.state.nlp_service, "_ensure_qa"):
            app.state.nlp_service._ensure_qa()
        # Optional: log readiness/info if available
        info = {}
        try:
            info = getattr(app.state.nlp_service, "qa_info", lambda: {})()
        except Exception:
            info = {}
        logger.info(
            "QA ready: model=%s device=%s chunk=%s/%s",
            info.get("model", "?"),
            info.get("device", "?"),
            info.get("chunk_chars", "?"),
            info.get("overlap", "?"),
        )
    except Exception as e:
        logger.exception("Failed to preload QA model: %s", e)


@app.on_event("shutdown")
def on_shutdown():
    from app.scheduler import shutdown_scheduler

    shutdown_scheduler()  # Fixed: was shutdown_shutdown()


@app.get("/health/qa")
def qa_health():
    svc = getattr(app.state, "nlp_service", None)
    ready = False
    info = {}
    try:
        if svc is not None and hasattr(svc, "is_qa_ready"):
            ready = bool(svc.is_qa_ready())
        elif svc is not None:
            # Fallback: if no explicit method, assume ready after preload attempt
            ready = True
        if ready and hasattr(svc, "qa_info"):
            info = svc.qa_info()
    except Exception:
        ready = False
        info = {}
    return {"ready": ready, "info": info}