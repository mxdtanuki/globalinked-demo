from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import OperationalError
from fastapi import HTTPException
import os
from dotenv import load_dotenv

# Load .env from the directory explicitly
env_path = os.path.join(os.path.dirname(__file__), ".env")
print("Looking for .env at:", env_path)
load_dotenv(dotenv_path=env_path)

# Resolve base URL
raw_url = (os.getenv("DATABASE_URL") or "").strip()
if not raw_url:
    # Fallback for local dev if .env missing
    raw_url = "postgresql://postgres:197364@localhost/globalinked_db"

# Force psycopg3 driver and sslmode for Supabase
db_url = raw_url.replace("postgresql://", "postgresql+psycopg://", 1)
if "supabase.co" in db_url and "sslmode" not in db_url:
    delimiter = "&" if "?" in db_url else "?"
    db_url = f"{db_url}{delimiter}sslmode=require"

# Log effective URL without driver suffix for clarity
print("LOADED DB URL:", raw_url)

# Pool settings (keep modest for PgBouncer transaction pooling)
POOL_SIZE = int(os.getenv("DB_POOL_SIZE", 5))          # connections kept open by SQLAlchemy
MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", 5))    # temporary extra connections
POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", 300))  # seconds
POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", 10))   # seconds to wait for a free conn
CONNECT_TIMEOUT = int(os.getenv("DB_CONNECT_TIMEOUT", 10))  # seconds for initial TCP connect

def _make_engine(application_name: str):
    return create_engine(
        db_url,
        # Pool configuration
        pool_size=POOL_SIZE,
        max_overflow=MAX_OVERFLOW,
        pool_pre_ping=True,         # detect dead connections lazily
        pool_recycle=POOL_RECYCLE,  # prevent stale sockets
        pool_timeout=POOL_TIMEOUT,
        pool_use_lifo=True,
        poolclass=QueuePool,
        # Connection args
        connect_args={
            "connect_timeout": CONNECT_TIMEOUT,
            "options": f"-c application_name={application_name}",
        },
        # Engine config
        echo=False,
        future=True,
    )

# Single global Engine and Session factory
engine = _make_engine("globalinked_app")

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
    future=True,
)

Base = declarative_base()

def get_db():
    """
    FastAPI dependency providing a short-lived session.
    - No eager 'SELECT 1' here to avoid connection bursts.
    - pool_pre_ping handles dead connections at first actual use.
    """
    db = SessionLocal()
    try:
        yield db
    except OperationalError as e:
        # Optional: limited recovery for common transient issues
        msg = str(e).lower()
        if any(k in msg for k in [
            "ssl connection has been closed",
            "server closed the connection",
            "connection was closed",
            "timeout",
        ]):
            try:
                db.close()
            except Exception:
                pass
            # Attempt a lightweight pool reset
            reset_connection_pool()
            # Yield a fresh session
            db2 = SessionLocal()
            try:
                yield db2
            finally:
                try:
                    db2.close()
                except Exception:
                    pass
        else:
            raise
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass
        raise
    finally:
        # Ensure the original session is closed
        try:
            db.close()
        except Exception:
            pass

def reset_connection_pool():
    """
    Emergency reset of the connection pool.
    Disposes current connections and rebinds SessionLocal to a fresh Engine.
    """
    global engine, SessionLocal
    print("RESETTING CONNECTION POOL...")
    try:
        engine.dispose()
        print("Old connections disposed")
    except Exception as e:
        print(f"Dispose warning: {e}")

    engine = _make_engine("globalinked_reset")
    # Rebind existing sessionmaker instead of recreating it
    SessionLocal.configure(bind=engine)
    print("POOL RESET COMPLETE")
    return {"status": "success", "message": "Connection pool reset"}

def check_pool_status():
    """Return current pool status (best-effort; values are instantaneous)."""
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
    print(f"Pool Status: {status}")
    return status

def test_connection():
    """Short health check that opens and closes a connection quickly."""
    try:
        with engine.connect() as conn:
            conn.exec_driver_sql("select 1")
        return {"status": "healthy"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}