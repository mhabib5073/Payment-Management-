"""Create a login, e.g. another manager:

    python -m scripts.create_user --email priya.sharma@acme.com --role manager

The password is asked for interactively so it never lands in your shell history.
"""
// Demo two logins 
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

