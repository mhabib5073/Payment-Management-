from typing import Literal

from fastapi import APIRouter, Depends

from app.api.dependencies import get_insights_service, get_repo, require_manager

from app.constants import COUNTRY_CURRENCY, DEPARTMENTS
from app.repositories.employee_repository import EmployeeRepository
from app.schemas import Meta, SalaryStats
from app.services.insights_service import InsightsService


router = APIRouter(prefix="/api", tags=["Insights"], dependencies=[Depends(require_manager)])

@router.get("/insights/salaries", response_model=list[SalaryStats])
def salary_insights(
    group_by: Literal["country", "job_title", "department"] = "country",
    country: str | None = None,
    service: InsightsService = Depends(get_insights_service),
):
    """Headcount and min/max/average/median salary per group, optionally within one country."""
    return service.salary_stats(group_by, country)

@router.get("/meta", response_model=Meta)
def meta(repo: EmployeeRepository = Depends(get_repo)):
    """Options for dropdowns in the UI."""
    return Meta(countries=COUNTRY_CURRENCY, departments=DEPARTMENTS, job_titles=repo.distinct_job_titles())
