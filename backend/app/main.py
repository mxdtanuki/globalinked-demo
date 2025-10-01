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

@app.on_event("shutdown")
def on_shutdown():
    from app.scheduler import shutdown_scheduler
    shutdown_scheduler()