from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError, OperationalError
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
from app.services.nlp_extraction_service import NLPLegalExtractionService  # ✅ CORRECT CLASS NAME
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
    app.state.nlp_service = NLPLegalExtractionService(  # ✅ CORRECT CLASS NAME
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
async def startup_event():
    logger.info("🚀 Application starting up...")
    
    # ✅ START SCHEDULER
    try:
        from app.scheduler import start_scheduler
        start_scheduler()
        logger.info("✅ Scheduler started successfully")
    except Exception as e:
        logger.error(f"❌ Failed to start scheduler: {e}")
    
    # ✅ ENSURE SPACY MODEL IS AVAILABLE
    try:
        import spacy
        try:
            nlp = spacy.load("en_core_web_sm")
            logger.info("✅ spaCy model 'en_core_web_sm' is ready")
        except OSError:
            logger.warning("spaCy model not found, downloading...")
            import subprocess
            import sys
            result = subprocess.run(
                [sys.executable, "-m", "spacy", "download", "en_core_web_sm"],
                capture_output=True,
                text=True,
                timeout=300
            )
            if result.returncode == 0:
                logger.info("spaCy model downloaded")
            else:
                logger.error(f"Failed to download spaCy model: {result.stderr}")
    except Exception as e:
        logger.error(f"spaCy setup error: {e}")
    
    # Verify Document Processing Service
    try:
        doc_service = getattr(app.state, "doc_processing_service", None)
        if doc_service:
            logger.info("DocumentProcessingService initialized")
        else:
            logger.warning("DocumentProcessingService not initialized")
    except Exception as e:
        logger.error(f"DocumentProcessingService error: {e}")
    
    # Verify NLP Service
    try:
        nlp_service = getattr(app.state, "nlp_service", None)
        if nlp_service:
            logger.info("NLPLegalExtractionService initialized")
            logger.info("Legal-BERT model will load on first request")
        else:
            logger.warning("NLPLegalExtractionService not initialized")
    except Exception as e:
        logger.error(f"NLPLegalExtractionService error: {e}")
    
    logger.info("Startup complete")


@app.on_event("shutdown")
def on_shutdown():
    """Shutdown scheduler."""
    try:
        from app.scheduler import shutdown_scheduler
        shutdown_scheduler()
        logger.info("Scheduler stopped.")
    except Exception as e:
        logger.warning(f"Scheduler shutdown issue: {e}")

# ---------------------------
# NLP Health Endpoints
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


@app.get("/health/models")
def models_health():
    """Check model availability."""
    models_status = {
        "spacy": {"available": False, "version": None},
        "legal_bert": {"available": False, "model": None},
        "ocr": {"available": False, "disabled": False},
        "document_processing": {"available": False},
    }
    
    # Check spaCy
    try:
        import spacy
        try:
            nlp = spacy.load("en_core_web_sm")
            models_status["spacy"]["available"] = True
            models_status["spacy"]["version"] = spacy.__version__
        except OSError:
            models_status["spacy"]["available"] = False
    except Exception as e:
        models_status["spacy"]["error"] = str(e)
    
    # Check Legal-BERT / NLP Service
    try:
        svc = getattr(app.state, "nlp_service", None)
        if svc and hasattr(svc, "is_qa_ready"):
            models_status["legal_bert"]["available"] = svc.is_qa_ready()
            if hasattr(svc, "model_name_in_use"):
                models_status["legal_bert"]["model"] = svc.model_name_in_use
    except Exception as e:
        models_status["legal_bert"]["error"] = str(e)
    
    # Check OCR
    try:
        import os
        disabled = os.environ.get("DISABLE_PADDLEOCR", "0") in ("1", "true", "True")
        models_status["ocr"]["disabled"] = disabled
        if not disabled:
            try:
                from paddleocr import PaddleOCR
                models_status["ocr"]["available"] = True
            except Exception:
                models_status["ocr"]["available"] = False
    except Exception as e:
        models_status["ocr"]["error"] = str(e)
    
    # Check Document Processing
    try:
        doc_svc = getattr(app.state, "doc_processing_service", None)
        models_status["document_processing"]["available"] = doc_svc is not None
    except Exception as e:
        models_status["document_processing"]["error"] = str(e)
    
    return {
        "timestamp": time.time(),
        "models": models_status,
        "all_ready": all(m.get("available", False) for m in models_status.values() if "disabled" not in m or not m["disabled"])
    }

# database connection health check middleware
@app.middleware("http")
async def db_session_middleware(request, call_next):
    """Handle database connection errors."""
    try:
        response = await call_next(request)
        return response
    except (DBAPIError, OperationalError) as e:
        if "DbHandler exited" in str(e) or "connection" in str(e).lower():
            logger.error(f"Database connection lost: {e}")
            try:
                from app.database import reset_connection_pool
                reset_connection_pool()
                logger.info("Connection pool reset")
            except Exception as reset_err:
                logger.error(f"Failed to reset pool: {reset_err}")
        raise HTTPException(status_code=503, detail="Database connection error. Please try again.")
