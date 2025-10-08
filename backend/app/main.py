from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

from app.controllers import auth_controller, notification_controller, email_controller, registration_controller, agreement_controller, audit_controller
from app.database import Base, engine
from app.models.notification import Notification

from app.controllers import partners_controller
from app.controllers import document_controller

from fastapi.routing import APIRoute

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Globalinked API",
    description="Monitoring System for OIA",
    version="1.0.0"
)
    
origins = [
    "https://globalinked.systems",  # Frontend domain
    "https://www.globalinked.systems",  # Frontend domain with www
    "https://api.globalinked.systems",  # Backend domain, if self-requests occur
    "http://localhost:3000"]            # For dev

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


# Root route
@app.on_event("startup")
def on_startup():
    from app.scheduler import start_scheduler
    start_scheduler()

    import threading, os
    from app.services.nlp_extraction_service import NLPLegalExtractionService

    def _init_nlp():
        try:
            model_override = os.getenv("QA_MODEL_OVERRIDE", "deepset/roberta-base-squad2")
            qa_threshold = float(os.getenv("QA_CONFIDENCE_THRESHOLD", "0.12"))
            app.state.nlp_service = NLPLegalExtractionService(
                model_override=model_override,
                qa_confidence_threshold=qa_threshold
            )
            print("NLPLegalExtractionService created and stored in app.state (background init)")
        except Exception as e:
            print("⚠ Background NLPLegalExtractionService init failed:", e)
            import traceback; traceback.print_exc()
            app.state.nlp_service = None

    # spawn daemon thread to load model
    t = threading.Thread(target=_init_nlp, daemon=True)
    t.start()

@app.on_event("shutdown")
def on_shutdown():
    from app.scheduler import shutdown_scheduler
    shutdown_scheduler()