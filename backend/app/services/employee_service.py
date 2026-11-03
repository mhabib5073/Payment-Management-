from app.constants import COUNTRY_CURRENCY
from app.models import Employee
from app.repositories.employee_repository import EmployeeRepository
from app.schemas import EmployeeCreate, EmployeeUpdate
from app.services.errors import ConflictError, NotFoundError, ValidationError


def currency_for(country: str) -> str:
    try:
        return COUNTRY_CURRENCY[country]
    except KeyError:
        raise ValidationError(f"Unsupported country: {country}") from None


class EmployeeService:
    """Business rules for employees. Knows nothing about HTTP."""

    def __init__(self, repo: EmployeeRepository):
        self.repo = repo

    def get(self, employee_id: int) -> Employee:
        employee = self.repo.get(employee_id)
        if employee is None:
            raise NotFoundError(f"Employee {employee_id} not found")
        return employee

    def create(self, data: EmployeeCreate) -> Employee:
        if self.repo.get_by_email(data.email):
            raise ConflictError("An employee with this email already exists")
        values = data.model_dump()
        values["email"] = values["email"].lower()
        employee = Employee(**values, currency=currency_for(data.country))
        return self.repo.add(employee)

    def update(self, employee_id: int, data: EmployeeUpdate) -> Employee:
        employee = self.get(employee_id)
        changes = data.model_dump(exclude_unset=True)

        if "email" in changes:
            changes["email"] = changes["email"].lower()
            existing = self.repo.get_by_email(changes["email"])
            if existing and existing.id != employee_id:
                raise ConflictError("An employee with this email already exists")
        if "country" in changes:
            changes["currency"] = currency_for(changes["country"])

        for field, value in changes.items():
            setattr(employee, field, value)
        return self.repo.save(employee)

    def delete(self, employee_id: int) -> None:
        self.repo.delete(self.get(employee_id))

    def search(self, **filters):
        return self.repo.search(**filters)