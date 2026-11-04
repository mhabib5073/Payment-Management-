import os

os.environ["DATABASE_URL"] = "sqlite://"  # never touch the real DB file in tests
os.environ["BCRYPT_ROUNDS"] = "4"  # minimum cost: fast tests, same code path
from datetime import date  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.database import Base, get_db  # noqa: E402
from app.main import create_app  # noqa: E402
from app.repositories.employee_repository import EmployeeRepository  # noqa: E402
from app.services.employee_service import EmployeeService  # noqa: E402

from app.api.dependencies import get_current_user  # noqa: E402
from app.models import User  # noqa: E402
from app.repositories.user_repository import UserRepository  # noqa: E402
from app.services.auth_service import AuthService  # noqa: E402

@pytest.fixture
def db():
    """Fresh in-memory database per test; StaticPool keeps one shared connection."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, autoflush=False, autocommit=False)()
    try:
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture
def service(db):
    return EmployeeService(EmployeeRepository(db))

@pytest.fixture
def auth(db):
    return AuthService(UserRepository(db), EmployeeRepository(db))


@pytest.fixture
def anon_client(db):
    """Real authentication: requests need a real token."""
    app = create_app()
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def client(anon_client):
    """Logged in as a manager, so feature tests don't repeat the login steps."""
    manager = User(id=0, email="manager@acme.com", role="manager", hashed_password="", is_active=True)
    anon_client.app.dependency_overrides[get_current_user] = lambda: manager
    return anon_client
def employee_payload(**overrides):
    payload = {
        "first_name": "Priya",
        "last_name": "Sharma",
        "email": "priya.sharma@acme.com",
        "job_title": "Software Engineer",
        "department": "Engineering",
        "country": "India",
        "salary": 2_400_000,
        "hire_date": date(2022, 4, 1).isoformat(),
    }
    payload.update(overrides)
    return payload