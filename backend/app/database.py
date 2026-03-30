from sqlalchemy import create_engine, text, event, Engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool, NullPool
from sqlalchemy.exc import OperationalError
import os
from dotenv import load_dotenv
import logging

logger = logging.getLogger("uvicorn.error")

# Load .env from the directory explicitly
env_path = os.path.join(os.path.dirname(__file__), ".env")
print("Looking for .env at:", env_path)
load_dotenv(dotenv_path=env_path)

# Resolve base URL
raw_url = (os.getenv("DATABASE_URL") or "").strip()
if not raw_url:
    raw_url = "postgresql://postgres:197364@localhost/globalinked_db"

# Force psycopg3 driver and sslmode for Supabase
db_url = raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
if "supabase.co" in db_url and "sslmode" not in db_url:
    delimiter = "&" if "?" in db_url else "?"
    db_url = f"{db_url}{delimiter}sslmode=require"

print("LOADED DB URL:", raw_url)

# Pool settings
POOL_SIZE = int(os.getenv("DB_POOL_SIZE", 20))
MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", 2))
POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", 10))
POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", 1800))
CONNECT_TIMEOUT = int(os.getenv("DB_CONNECT_TIMEOUT", 10))
ECHO = os.getenv("DB_ECHO", "false").lower() == "true"

def _make_engine(application_name: str):
    """Create engine."""
    engine = create_engine(
        db_url,
        # Pool configuration
        poolclass=QueuePool,
        pool_size=POOL_SIZE,
        max_overflow=MAX_OVERFLOW,
        pool_pre_ping=True,
        pool_recycle=POOL_RECYCLE,
        pool_timeout=POOL_TIMEOUT,
        pool_use_lifo=False,
        echo=False,
        future=True,
        # Connection args
        connect_args={
            #"connect_timeout": CONNECT_TIMEOUT,
            #"command_timeout": CONNECT_TIMEOUT,
            "options": f"-c application_name={application_name}",
        },
    )

    @event.listens_for(Engine, "connect")
    def receive_connect(dbapi_conn, connection_record):
        """Log connections."""
        logger.debug(f"DB connection established: {application_name}")

    @event.listens_for(Engine, "checkin")
    def receive_checkin(dbapi_conn, connection_record):
        """Log checkin."""
        logger.debug("DB connection returned to pool")

    @event.listens_for(Engine, "checkout")
    def receive_checkout(dbapi_conn, connection_record, connection_proxy):
        """Log checkout."""
        logger.debug("DB connection checked out from pool")

    return engine

# Single global Engine and Session factory
engine = _make_engine("globalinked_app")

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=True,  
    future=True,
)

Base = declarative_base()

def get_db() -> Session:
    """Get database session."""
    db = SessionLocal()
    try:
        # Test connection immediately
        db.execute(text("SELECT 1"))
        yield db
    except Exception as e:
        logger.error(f"❌ Database session error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def reset_connection_pool():
    """Reset connection pool."""
    global engine, SessionLocal
    logger.info("Resetting connection pool...")
    try:
        engine.dispose()
        logger.info("Connections disposed")
    except Exception as e:
        logger.warning(f"Dispose warning: {e}")

    engine = _make_engine("globalinked_reset")
    SessionLocal.configure(bind=engine)
    logger.info("Pool reset complete")
    return {"status": "success", "message": "Connection pool reset"}

def check_pool_status():
    """Get pool status."""
    pool = engine.pool
    try:
        status = {
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "configured": {
                "pool_size": POOL_SIZE,
                "max_overflow": MAX_OVERFLOW,
                "pool_timeout": POOL_TIMEOUT,
                "pool_recycle": POOL_RECYCLE,
            },
        }
    except Exception as e:
        status = {"error": str(e)}
    
    logger.info(f"Pool Status: {status}")
    return status

def test_connection():
    """Test connection."""
    try:
        with engine.connect() as conn:
            conn.exec_driver_sql("SELECT 1")
        return {"status": "healthy"}
    except Exception as e:
        logger.error(f"Connection test failed: {e}")
        return {"status": "unhealthy", "error": str(e)}