from typing import Literal

from fastapi import APIRouter, Depends, Query, status

from app.api.dependencies import get_current_user, get_employee_service, require_manager
from app.models import User
from app.schemas import EmployeeCreate, EmployeeOut, EmployeeUpdate, EmployeeView, EmployeeViewPage, SortField
from app.services.access_policy import check_sort_allowed, present
from app.services.employee_service import EmployeeService

router = APIRouter(prefix="/api/employees", tags=["Employees"])
manager_only = [Depends(require_manager)]


# ---- read: any logged-in user (salaries hidden from employees, except their own) ----
@router.get("", response_model=EmployeeViewPage)
def list_employees(
    search: str | None = Query(None, max_length=100),
    country: str | None = None,
    department: str | None = None,
    job_title: str | None = None,
    sort: SortField = "name",
    order: Literal["asc", "desc"] = "asc",
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    user: User = Depends(get_current_user),
    service: EmployeeService = Depends(get_employee_service),
):
    check_sort_allowed(user, sort)
    items, total = service.search(
        search=search, country=country, department=department, job_title=job_title,
        sort=sort, order=order, page=page, page_size=page_size,
    )
    return EmployeeViewPage(
        items=[present(e, user) for e in items], total=total, page=page, page_size=page_size
    )


@router.get("/{employee_id}", response_model=EmployeeView)
def get_employee(
    employee_id: int,
    user: User = Depends(get_current_user),
    service: EmployeeService = Depends(get_employee_service),
):
    return present(service.get(employee_id), user)


# ---- write: managers only ----
@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED, dependencies=manager_only)
def create_employee(data: EmployeeCreate, service: EmployeeService = Depends(get_employee_service)):
    return service.create(data)


@router.patch("/{employee_id}", response_model=EmployeeOut, dependencies=manager_only)
def update_employee(
    employee_id: int, data: EmployeeUpdate, service: EmployeeService = Depends(get_employee_service)
):
    return service.update(employee_id, data)


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=manager_only)
def delete_employee(employee_id: int, service: EmployeeService = Depends(get_employee_service)):
    service.delete(employee_id)