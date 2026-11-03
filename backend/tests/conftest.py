import os

os.environ["DATABASE_URL"] = "sqlite://"  # never touch the real DB file in tests

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


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine, expire_on_commit=False)()
    yield session
    session.close()
    engine.dispose()


@pytest.fixture
def service(db):
    return EmployeeService(EmployeeRepository(db))


@pytest.fixture
def client(db):
    app = create_app()
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as test_client:
        yield test_client


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