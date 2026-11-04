"""Create a login, e.g. another manager:

    python -m scripts.create_user --email priya.sharma@acme.com --role manager

The password is asked for interactively so it never lands in your shell history.
"""
import argparse
import getpass

from app import models  # noqa: F401
from app.database import Base, SessionLocal, engine
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.errors import DomainError

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a user account")
    parser.add_argument("--email", required=True)
    parser.add_argument("--role", choices=["manager", "employee"], default="manager")
    args = parser.parse_args()

    password = getpass.getpass("Password (min 8 characters): ")
    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters")

    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        try:
            user = AuthService(UserRepository(db), EmployeeRepository(db)).create_user(
                args.email, password, args.role
            )
        except DomainError as exc:
            raise SystemExit(f"Error: {exc}") from None
    linked = f"linked to employee #{user.employee_id}" if user.employee_id else "no employee record"
    print(f"Created {user.role} {user.email} ({linked})")