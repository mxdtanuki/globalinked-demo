from app.utils.utils import hash_password
from app.database import engine
import sqlalchemy

user_name = "OIA admin"
user_email = "pup.international.affairs@gmail.com"
user_password = "admin123" 
user_position = "Director"
user_role = "admin"
user_status = "approved"

# Generate bcrypt hash
hashed_password = hash_password(user_password)

print(f"Creating admin user: {user_name}")
print(f"Email: {user_email}")
print(f"Password: {user_password}")
print(f"Hash: {hashed_password[:20]}...")

# Use raw SQL to insert user directly
sql = """
INSERT INTO users (user_name, user_email, user_pass, user_position, user_role, user_status)
VALUES (:user_name, :user_email, :user_pass, :user_position, :user_role, :user_status)
"""

try:
    with engine.connect() as conn:
        # Check if user exists first
        check_sql = "SELECT user_name FROM users WHERE user_name = :user_name"
        result = conn.execute(sqlalchemy.text(check_sql), {"user_name": user_name})
        existing = result.fetchone()
        
        if existing:
            print(f"❌ User '{user_name}' already exists!")
        else:
            # Insert new user
            conn.execute(
                sqlalchemy.text(sql),
                {
                    "user_name": user_name,
                    "user_email": user_email,
                    "user_pass": hashed_password,
                    "user_position": user_position,
                    "user_role": user_role,
                    "user_status": user_status
                }
            )
            conn.commit()
            
            print("✅ Admin user created successfully!")
            print(f"\n🔑 Login credentials:")
            print(f"Username: {user_name}")
            print(f"Password: {user_password}")
        
        # Show all users
        result = conn.execute(sqlalchemy.text("SELECT user_name, user_email, user_role, user_status FROM users ORDER BY user_name"))
        print(f"\n📋 All users in database:")
        for row in result:
            print(f"- {row[0]} ({row[1]}) - {row[2]} [{row[3]}]")

except Exception as e:
    print(f"❌ Error: {e}")