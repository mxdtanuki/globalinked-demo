import bcrypt
bcrypt.__about__ = type('', (), {'__version__': '4.0.1'})()

from app.database import SessionLocal
from app.models.users import Users
from passlib.context import CryptContext

db = SessionLocal()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

user = Users(
    user_name="admin",
    user_pass=pwd_context.hash("admin123"),
    user_profile_img="",
    user_position="admin"
)

db.add(user)
db.commit()
db.close()
