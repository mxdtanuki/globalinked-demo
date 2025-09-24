from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

#Load .env from the directory explicitly
env_path = os.path.join(os.path.dirname(__file__), ".env")
print("Looking for .env at:", env_path)

load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # fallback for local dev if .env missing
    DATABASE_URL = "postgresql://postgres:197364@localhost/globalinked_db"

# If using Supabase later, force SSL
if "supabase.co" in DATABASE_URL and "sslmode" not in DATABASE_URL:
    DATABASE_URL += "?sslmode=require"

print("LOADED DB URL:", DATABASE_URL)  # should NOT be None

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
