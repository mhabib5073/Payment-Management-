from datetime import date
from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

SortField = Literal["name", "salary", "hire_date", "country", "job_title"]

class EmployeeBase(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    job_title: str = Field(min_length=2, max_length=100)
    department: str = Field(min_length=2, max_length=100)
    country: str
    salary: int = Field(gt=0, le=1_000_000_000)
    hire_date: date

    @field_validator("first_name", "last_name", "job_title", "department")
    @classmethod
    def strip(cls, value: str) -> str:
        return value.strip()

    @field_validator("hire_date")
    @classmethod
    def not_in_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("hire_date cannot be in the future")
        return value


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, min_length=1, max_length=100)
    email: EmailStr | None = None
    job_title: str | None = Field(None, min_length=2, max_length=100)
    department: str | None = Field(None, min_length=2, max_length=100)
    country: str | None = None
    salary: int | None = Field(None, gt=0, le=1_000_000_000)
    hire_date: date | None = None


class EmployeeOut(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    currency: str


class EmployeePage(BaseModel):
    items: list[EmployeeOut]
    total: int
    page: int
    page_size: int


class SalaryStats(BaseModel):
    group: str
    currency: str
    headcount: int
    min_salary: int
    max_salary: int
    avg_salary: int
    median_salary: int


class Meta(BaseModel):
    countries: dict[str, str]
    departments: list[str]
    job_titles: list[str]