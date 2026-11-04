"""Read-only access for employees: they can browse the directory but not other people's pay."""
import pytest

from app.schemas import EmployeeCreate
from tests.conftest import employee_payload
from tests.test_auth import login, register


@pytest.fixture
def people(service):
    me = service.create(EmployeeCreate(**employee_payload(email="ravi@acme.com", first_name="Ravi")))
    other = service.create(EmployeeCreate(**employee_payload(email="anu@acme.com", first_name="Anu")))
    return me, other


@pytest.fixture
def employee_headers(anon_client, people):
    register(anon_client, "ravi@acme.com")
    return login(anon_client, "ravi@acme.com")


def test_employee_can_browse_the_directory(anon_client, employee_headers):
    page = anon_client.get("/api/employees", headers=employee_headers).json()
    assert page["total"] == 2


def test_employee_sees_own_salary_but_not_others(anon_client, employee_headers):
    items = anon_client.get("/api/employees", headers=employee_headers).json()["items"]
    salaries = {e["email"]: e["salary"] for e in items}
    assert salaries == {"ravi@acme.com": 2_400_000, "anu@acme.com": None}


def test_employee_detail_hides_other_salaries(anon_client, employee_headers, people):
    me, other = people
    assert anon_client.get(f"/api/employees/{other.id}", headers=employee_headers).json()["salary"] is None
    assert anon_client.get(f"/api/employees/{me.id}", headers=employee_headers).json()["salary"] == 2_400_000


def test_employee_cannot_sort_by_salary(anon_client, employee_headers):
    response = anon_client.get("/api/employees", params={"sort": "salary"}, headers=employee_headers)
    assert response.status_code == 403


def test_employee_can_read_filter_options(anon_client, employee_headers):
    assert anon_client.get("/api/meta", headers=employee_headers).status_code == 200


def test_manager_sees_every_salary(client, people):
    items = client.get("/api/employees").json()["items"]
    assert all(e["salary"] is not None for e in items)