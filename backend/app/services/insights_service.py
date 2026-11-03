from collections import defaultdict
from statistics import median

from app.models import Employee
from app.repositories.employee_repository import EmployeeRepository
from app.schemas import SalaryStats

GROUP_COLUMNS = {
    "country": Employee.country,
    "job_title": Employee.job_title,
    "department": Employee.department,
}


def compute_stats(rows: list[tuple[str, str, int]]) -> list[SalaryStats]:
    groups: dict[tuple[str, str], list[int]] = defaultdict(list)
    for group, currency, salary in rows:
        groups[(group, currency)].append(salary)

    stats = [
        SalaryStats(
            group=group,
            currency=currency,
            headcount=len(salaries),
            min_salary=min(salaries),
            max_salary=max(salaries),
            avg_salary=round(sum(salaries) / len(salaries)),
            median_salary=round(median(salaries)),
        )
        for (group, currency), salaries in groups.items()
    ]
    return sorted(stats, key=lambda s: (-s.headcount, s.group))


class InsightsService:
    def __init__(self, repo: EmployeeRepository):
        self.repo = repo

    def salary_stats(self, group_by: str, country: str | None = None) -> list[SalaryStats]:
        rows = self.repo.salary_rows(GROUP_COLUMNS[group_by], country)
        return compute_stats(rows)