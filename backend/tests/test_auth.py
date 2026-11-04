import pytest

from app.schemas import EmployeeCreate
from tests.conftest import employee_payload

PASSWORD = "Secret@123"


def register(client, email, password=PASSWORD):
    return client.post("/api/auth/register", json={"email": email, "password": password})


def login(client, email, password=PASSWORD):
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def employee_headers(anon_client, service):
    service.create(EmployeeCreate(**employee_payload(email="ravi@acme.com", first_name="Ravi")))
    register(anon_client, "ravi@acme.com")
    return login(anon_client, "ravi@acme.com")


@pytest.fixture
def manager_headers(anon_client, auth):
    auth.create_user("boss@acme.com", PASSWORD, "manager")
    return login(anon_client, "boss@acme.com")


def test_registration_requires_an_existing_employee_record(anon_client):
    assert register(anon_client, "stranger@acme.com").status_code == 403


def test_registered_user_is_an_employee_linked_to_their_record(anon_client, service):
    record = service.create(EmployeeCreate(**employee_payload(email="ravi@acme.com")))
    response = register(anon_client, "Ravi@ACME.com")
    assert response.status_code == 201
    assert (response.json()["role"], response.json()["employee_id"]) == ("employee", record.id)


def test_cannot_register_twice(anon_client, employee_headers):
    assert register(anon_client, "ravi@acme.com", "Other@1234").status_code == 409


def test_short_password_is_rejected(anon_client):
    assert register(anon_client, "ravi@acme.com", "short").status_code == 422


def test_wrong_password_and_unknown_email_look_the_same(anon_client, employee_headers):
    wrong = anon_client.post("/api/auth/login", json={"email": "ravi@acme.com", "password": "nope-nope"})
    unknown = anon_client.post("/api/auth/login", json={"email": "who@acme.com", "password": "nope-nope"})
    assert wrong.status_code == unknown.status_code == 401
    assert wrong.json() == unknown.json()


def test_employee_sees_only_their_own_profile(anon_client, employee_headers):
    me = anon_client.get("/api/auth/me", headers=employee_headers).json()
    assert me["user"]["role"] == "employee"
    assert me["profile"]["email"] == "ravi@acme.com"


@pytest.mark.parametrize("method, path", [
    ("post", "/api/employees"),
    ("patch", "/api/employees/1"),
    ("delete", "/api/employees/1"),
    ("get", "/api/insights/salaries"),
])
def test_employee_is_forbidden_from_manager_endpoints(anon_client, employee_headers, method, path):
    response = getattr(anon_client, method)(path, headers=employee_headers)
    assert response.status_code == 403


def test_requests_without_or_with_a_bad_token_are_rejected(anon_client):
    assert anon_client.get("/api/employees").status_code == 401
    assert anon_client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-token"}).status_code == 401


def test_manager_can_use_everything_and_see_own_profile(anon_client, manager_headers):
    payload = employee_payload(email="new@acme.com")
    assert anon_client.post("/api/employees", json=payload, headers=manager_headers).status_code == 201
    assert anon_client.get("/api/employees", headers=manager_headers).json()["total"] == 1
    assert anon_client.get("/api/insights/salaries", headers=manager_headers).status_code == 200
    me = anon_client.get("/api/auth/me", headers=manager_headers).json()
    assert me["user"]["role"] == "manager"
    assert me["profile"] is None  # this manager has no employee record


def test_deleting_an_employee_also_removes_their_login(anon_client, employee_headers, manager_headers):
    employee_id = anon_client.get("/api/auth/me", headers=employee_headers).json()["profile"]["id"]
    assert anon_client.delete(f"/api/employees/{employee_id}", headers=manager_headers).status_code == 204
    assert anon_client.get("/api/auth/me", headers=employee_headers).status_code == 401