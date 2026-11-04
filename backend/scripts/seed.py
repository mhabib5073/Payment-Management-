"""Seed the database with realistic, reproducible employees.

    python -m scripts.seed --count 10000 --reset
"""
import argparse
import random
import time
from datetime import date, timedelta

from sqlalchemy import insert
from app import models  

from app.database import Base, SessionLocal, engine

from app.constants import COUNTRY_CURRENCY, EMPLOYEE, MANAGER
from app.database import Base, SessionLocal, engine
from app.models import Employee
from app.repositories.employee_repository import EmployeeRepository
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService

FIRST_NAMES = [
    "Aarav", "Aditi", "Amit", "Ananya", "Arjun", "Diya", "Ishaan", "Kavya", "Priya", "Rahul",
    "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "David", "Sarah",
    "Oliver", "Amelia", "Harry", "Isla", "Lukas", "Mia", "Leon", "Emma", "Noah", "Sophia",
    "Liam", "Chloe", "Lucas", "Ava", "Mateus", "Julia", "Gabriel", "Laura", "Wei", "Mei",
]
LAST_NAMES = [
    "Sharma", "Patel", "Reddy", "Iyer", "Khan", "Gupta", "Smith", "Johnson", "Williams", "Brown",
    "Jones", "Miller", "Davis", "Wilson", "Taylor", "Evans", "Thomas", "Muller", "Schmidt", "Weber",
    "Fischer", "Tremblay", "Roy", "Martin", "Lee", "Tan", "Lim", "Silva", "Santos", "Oliveira",
]

# department -> [(job title, base annual salary in USD)]
JOBS = {
    "Engineering": [("Software Engineer", 95_000), ("Senior Software Engineer", 130_000),
                    ("Engineering Manager", 165_000)],
    "Product": [("Product Manager", 125_000), ("Senior Product Manager", 150_000)],
    "Sales": [("Sales Executive", 65_000), ("Account Manager", 85_000)],
    "Marketing": [("Marketing Specialist", 60_000), ("Marketing Manager", 95_000)],
    "Finance": [("Financial Analyst", 75_000), ("Finance Manager", 115_000)],
    "HR": [("HR Generalist", 58_000), ("HR Manager", 95_000)],
    "Operations": [("Operations Analyst", 62_000), ("Operations Manager", 100_000)],
    "Support": [("Support Specialist", 45_000), ("Support Lead", 62_000)],
}
DEPARTMENT_WEIGHTS = [35, 8, 15, 8, 7, 5, 10, 12]

# country -> (share of workforce, multiplier from USD base to local currency and pay level)
COUNTRIES = {
    "India": (30, 28.0),
    "United States": (25, 1.0),
    "United Kingdom": (10, 0.62),
    "Germany": (10, 0.72),
    "Canada": (8, 1.05),
    "Australia": (7, 1.15),
    "Singapore": (5, 1.0),
    "Brazil": (5, 2.1),
}


def generate_employees(count: int, seed: int = 42, today: date | None = None) -> list[dict]:
    """Pure and deterministic: the same seed always produces the same employees."""
    rng = random.Random(seed)
    today = today or date(2026, 1, 1)
    countries = list(COUNTRIES)
    country_weights = [COUNTRIES[c][0] for c in countries]
    departments = list(JOBS)

    rows = []
    for i in range(1, count + 1):
        first, last = rng.choice(FIRST_NAMES), rng.choice(LAST_NAMES)
        country = rng.choices(countries, weights=country_weights)[0]
        department = rng.choices(departments, weights=DEPARTMENT_WEIGHTS)[0]
        job_title, base_usd = rng.choice(JOBS[department])
        multiplier = COUNTRIES[country][1]
        salary = round(base_usd * multiplier * rng.uniform(0.85, 1.20), -2)
        rows.append({
            "first_name": first,
            "last_name": last,
            "email": f"{first}.{last}.{i}@acme.com".lower(),
            "job_title": job_title,
            "department": department,
            "country": country,
            "currency": COUNTRY_CURRENCY[country],
            "salary": int(salary),
            "hire_date": today - timedelta(days=rng.randint(30, 15 * 365)),
        })
    return rows

DEMO_USERS = [
    {"role": MANAGER, "password": "Manager@123", "employee": {
        "first_name": "Hema", "last_name": "Rao", "email": "hr.manager@acme.com",
        "job_title": "HR Manager", "department": "HR", "country": "India", "currency": "INR",
        "salary": 3_200_000, "hire_date": date(2018, 6, 1)}},
    {"role": EMPLOYEE, "password": "Employee@123", "employee": {
        "first_name": "Ravi", "last_name": "Kumar", "email": "demo.employee@acme.com",
        "job_title": "Software Engineer", "department": "Engineering", "country": "India",
        "currency": "INR", "salary": 2_100_000, "hire_date": date(2022, 3, 14)}},
]

def seed(count: int, seed_value: int, reset: bool, batch_size: int = 1000) -> None:
    if reset:
        Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    rows = generate_employees(count, seed_value)
    # the first rows become the demo people, so the total stays exactly `count`
    for i, demo in enumerate(DEMO_USERS[: len(rows)]):
        rows[i] = demo["employee"]
    with SessionLocal() as db:
        for start in range(0, len(rows), batch_size):
            db.execute(insert(Employee), rows[start:start + batch_size])  # bulk insert
        db.commit()
        auth = AuthService(UserRepository(db), EmployeeRepository(db))
        for demo in DEMO_USERS[: len(rows)]:
            auth.create_user(demo["employee"]["email"], demo["password"], demo["role"])

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed employees")
    parser.add_argument("--count", type=int, default=10_000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--reset", action="store_true", help="drop and recreate tables first")
    args = parser.parse_args()

    started = time.perf_counter()
    seed(args.count, args.seed, args.reset)
    print(f"Seeded {args.count} employees in {time.perf_counter() - started:.2f}s")