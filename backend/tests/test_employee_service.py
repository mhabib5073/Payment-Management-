import pytest

from app.schemas import EmployeeCreate, EmployeeUpdate
from app.services.errors import ConflictError, NotFoundError, ValidationError
from tests.conftest import employee_payload


def make(**overrides) -> EmployeeCreate:
    return EmployeeCreate(**employee_payload(**overrides))


def test_create_derives_currency_from_country(service):
    employee = service.create(make(country="Germany"))
    assert employee.currency == "EUR"


def test_create_normalises_email(service):
    employee = service.create(make(email="Priya.Sharma@ACME.com"))
    assert employee.email == "priya.sharma@acme.com"


def test_duplicate_email_is_rejected_case_insensitively(service):
    service.create(make())
    with pytest.raises(ConflictError):
        service.create(make(email="PRIYA.SHARMA@acme.com"))


def test_unsupported_country_is_rejected(service):
    with pytest.raises(ValidationError):
        service.create(make(country="Atlantis"))


def test_changing_country_updates_currency(service):
    employee = service.create(make(country="India"))
    updated = service.update(employee.id, EmployeeUpdate(country="United States", salary=120_000))
    assert (updated.currency, updated.salary) == ("USD", 120_000)


def test_update_only_changes_sent_fields(service):
    employee = service.create(make())
    updated = service.update(employee.id, EmployeeUpdate(salary=2_600_000))
    assert updated.salary == 2_600_000
    assert updated.job_title == "Software Engineer"


def test_update_to_another_employees_email_is_rejected(service):
    service.create(make(email="a@acme.com"))
    second = service.create(make(email="b@acme.com"))
    with pytest.raises(ConflictError):
        service.update(second.id, EmployeeUpdate(email="a@acme.com"))


def test_get_missing_employee_raises_not_found(service):
    with pytest.raises(NotFoundError):
        service.get(999)


def test_delete_removes_employee(service):
    employee = service.create(make())
    service.delete(employee.id)
    with pytest.raises(NotFoundError):
        service.get(employee.id)