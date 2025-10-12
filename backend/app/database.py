from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import OperationalError
import os
from dotenv import load_dotenv

# Load .env from the directory explicitly
env_path = os.path.join(os.path.dirname(__file__), ".env")
print("Looking for .env at:", env_path)
load_dotenv(dotenv_path=env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Fallback for local dev if .env missing
    DATABASE_URL = "postgresql://postgres:197364@localhost/globalinked_db"

# If using Supabase, force SSL when not already present
if "supabase.co" in DATABASE_URL and "sslmode" not in DATABASE_URL:
    delimiter = "&" if "?" in DATABASE_URL else "?"
    DATABASE_URL = f"{DATABASE_URL}{delimiter}sslmode=require"

print("LOADED DB URL:", DATABASE_URL)

# Supabase Pro Connection Pool Settings
POOL_SIZE = int(os.getenv("DB_POOL_SIZE", 25))           # Base connections
MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", 50))     # Extra connections when needed
POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", 300))    # 5 minutes - recycle connections
POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", 120))    # 2 minutes - wait for connection
CONNECT_TIMEOUT = int(os.getenv("DB_CONNECT_TIMEOUT", 30)) # 30 seconds - connection timeout

def _make_engine(application_name: str):
    """Create a SQLAlchemy engine with proper pooling for Supabase Pro."""
    return create_engine(
        DATABASE_URL,
        # Connection Pool Configuration
        pool_size=POOL_SIZE,
        max_overflow=MAX_OVERFLOW,
        pool_pre_ping=True,           # Test connections before use
        pool_recycle=POOL_RECYCLE,    # Prevent stale connections
        pool_timeout=POOL_TIMEOUT,    # Wait time for connection from pool
        pool_use_lifo=True,           # Use most recent connections first
        
        # Connection Arguments
        connect_args={
            "connect_timeout": CONNECT_TIMEOUT,
            "options": f"-c application_name={application_name}",
        },
        
        # Engine Configuration
        echo=False,                   # Set to True for SQL debugging
        poolclass=QueuePool,
    )

# Primary engine and session factory
engine = _make_engine("globalinked_app")

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,  # Keep objects usable after commit
)

Base = declarative_base()

# Enhanced dependency to get database session
def get_db():
    """
    Provide a database session with connection recovery.
    Handles SSL disconnections and pool exhaustion gracefully.
    """
    db = SessionLocal()
    try:
        # Test the connection immediately
        db.execute(text("SELECT 1"))
        yield db
    except OperationalError as e:
        error_msg = str(e).lower()
        if any(keyword in error_msg for keyword in [
            "ssl connection has been closed",
            "server closed the connection",
            "connection was closed",
            "timeout"
        ]):
            print(f"⚠️ Connection issue detected: {e}")
            print("🔄 Attempting connection recovery...")
            
            # Close the problematic session
            try:
                db.close()
            except Exception:
                pass
            
            # Reset the connection pool
            reset_connection_pool()
            
            # Try with a fresh session
            db = SessionLocal()
            try:
                db.execute(text("SELECT 1"))
                yield db
            except Exception as retry_error:
                print(f"❌ Connection recovery failed: {retry_error}")
                raise HTTPException(
                    status_code=503,
                    detail="Database connection unavailable. Please try again."
                )
        else:
            print(f"💥 Database error: {e}")
            raise
    except Exception as e:
        print(f"💥 Unexpected database error: {e}")
        try:
            db.rollback()
        except Exception:
            pass
        raise
    finally:
        try:
            db.close()
        except Exception:
            pass

# Connection pool management utilities
def reset_connection_pool():
    """Emergency reset of the connection pool."""
    global engine, SessionLocal
    print("🚨 RESETTING CONNECTION POOL...")

    try:
        # Dispose all existing connections
        engine.dispose()
        print("✅ Old connections disposed")
    except Exception as e:
        print(f"⚠️ Dispose warning (ignored): {e}")

    # Create new engine
    engine = _make_engine("globalinked_reset")

    # Create new session factory
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        expire_on_commit=False,
    )

    print("✅ CONNECTION POOL RESET COMPLETE!")
    return {"status": "success", "message": "Connection pool reset"}

def check_pool_status():
    """Return current connection pool status."""
    pool = engine.pool
    try:
        status = {
            "pool_size": pool.size(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "invalid": getattr(pool, "invalid", lambda: None)(),
            "total_capacity": POOL_SIZE + MAX_OVERFLOW,
            "settings": {
                "pool_size": POOL_SIZE,
                "max_overflow": MAX_OVERFLOW,
                "pool_timeout": POOL_TIMEOUT,
                "pool_recycle": POOL_RECYCLE,
            }
        }
    except Exception as e:
        print(f"Pool status error: {e}")
        status = {
            "error": str(e),
            "pool_size": None,
            "checked_out": None,
            "overflow": None,
            "invalid": None,
        }

    print(f"🔧 Pool Status: {status}")
    return status

# Health check function
def test_connection():
    """Test database connectivity."""
    try:
        db = SessionLocal()
        result = db.execute(text("SELECT 1 as test")).fetchone()
        db.close()
        return {"status": "healthy", "test_result": result[0] if result else None}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}