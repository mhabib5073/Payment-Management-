"""Who may see what. Kept in one place so the rules are easy to read, change and test."""
from app.constants import MANAGER
from app.models import Employee, User
from app.schemas import EmployeeView
from app.services.errors import ForbiddenError


def can_see_salary(viewer: User, employee_id: int) -> bool:
    """Managers see every salary; employees see only their own."""
    return viewer.role == MANAGER or viewer.employee_id == employee_id


def check_sort_allowed(viewer: User, sort: str) -> None:
    # sorting by salary would reveal who earns more, even with the numbers hidden
    if sort == "salary" and viewer.role != MANAGER:
        raise ForbiddenError("Only managers can sort by salary")


def present(employee: Employee, viewer: User) -> EmployeeView:
    view = EmployeeView.model_validate(employee, from_attributes=True)
    if not can_see_salary(viewer, employee.id):
        view.salary = None
    return view