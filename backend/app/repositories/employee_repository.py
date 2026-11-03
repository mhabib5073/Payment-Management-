from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models import Employee

SORT_COLUMNS = {
    "name": (Employee.last_name, Employee.first_name),
    "salary": (Employee.salary,),
    "hire_date": (Employee.hire_date,),
    "country": (Employee.country,),
    "job_title": (Employee.job_title,),
}


class EmployeeRepository:
    """All SQL for employees lives here. No business rules, no HTTP."""

    def __init__(self, db: Session):
        self.db = db

    def get(self, employee_id: int) -> Employee | None:
        return self.db.get(Employee, employee_id)

    def get_by_email(self, email: str) -> Employee | None:
        return self.db.scalar(select(Employee).where(func.lower(Employee.email) == email.lower()))

    def add(self, employee: Employee) -> Employee:
        self.db.add(employee)
        self.db.commit()
        self.db.refresh(employee)
        return employee

    def save(self, employee: Employee) -> Employee:
        self.db.commit()
        self.db.refresh(employee)
        return employee

    def delete(self, employee: Employee) -> None:
        self.db.delete(employee)
        self.db.commit()
    def search(
        self,
        *,
        search: str | None,
        country: str | None,
        department: str | None,
        job_title: str | None,
        sort: str,
        order: str,
        page: int,
        page_size: int,
    ) -> tuple[list[Employee], int]:
        stmt = select(Employee)
        if search:
            like = f"%{search.lower()}%"
            stmt = stmt.where(
                or_(
                    func.lower(Employee.first_name).like(like),
                    func.lower(Employee.last_name).like(like),
                    func.lower(Employee.email).like(like),
                )
            )
        if country:
            stmt = stmt.where(Employee.country == country)
        if department:
            stmt = stmt.where(Employee.department == department)
        if job_title:
            stmt = stmt.where(Employee.job_title == job_title)

        total = self.db.scalar(select(func.count()).select_from(stmt.subquery())) or 0

        columns = SORT_COLUMNS[sort]
        ordering = [c.desc() if order == "desc" else c.asc() for c in columns]
        stmt = stmt.order_by(*ordering, Employee.id).offset((page - 1) * page_size).limit(page_size)
        return list(self.db.scalars(stmt)), total
    def salary_rows(self, group_column, country: str | None) -> list[tuple[str, str, int]]:
        """(group, currency, salary) rows, used to compute statistics."""
        stmt = select(group_column, Employee.currency, Employee.salary)
        if country:
            stmt = stmt.where(Employee.country == country)
        return [tuple(row) for row in self.db.execute(stmt)]

    def distinct_job_titles(self) -> list[str]:
        return list(self.db.scalars(select(Employee.job_title).distinct().order_by(Employee.job_title)))