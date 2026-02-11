"""Create a test user if it doesn't already exist."""

from database import Base, SessionLocal, engine
from models.user import User
from services.auth_service import hash_password

# Ensure all tables exist (including users)
Base.metadata.create_all(bind=engine)

EMAIL = "test@dialog-hero.app"
PASSWORD = "Test1234!"
DISPLAY_NAME = "Test User"

db = SessionLocal()
try:
    existing = db.query(User).filter(User.email == EMAIL).first()
    if existing:
        print(f"User '{EMAIL}' existiert bereits (id={existing.id}). Keine Änderung.")
    else:
        user = User(
            email=EMAIL,
            password_hash=hash_password(PASSWORD),
            display_name=DISPLAY_NAME,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print(f"User erstellt: id={user.id}, email={user.email}")
    print()
    print("=== Login-Daten ===")
    print(f"  E-Mail:   {EMAIL}")
    print(f"  Passwort: {PASSWORD}")
finally:
    db.close()
