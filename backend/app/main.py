from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers from your controllers
from app.controllers import auth_controller, agreement_controller
from app.database import Base, engine

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Globalinked API",
    description="Monitoring System for OIA",
    version="1.0.0"
)

# CORS setup so frontend React can call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers 
app.include_router(auth_controller.router)
app.include_router(agreement_controller.router)

# Root route
@app.get("/")
def root():
    return {"message": "Globalinked backend is running."}

# Health check
@app.get("/health")
def health():
    return {"status": "healthy"}