"""Reference data. Currency is derived from country so HR can't enter a mismatch."""

COUNTRY_CURRENCY: dict[str, str] = {
    "India": "INR",
    "United States": "USD",
    "United Kingdom": "GBP",
    "Germany": "EUR",
    "Canada": "CAD",
    "Australia": "AUD",
    "Singapore": "SGD",
    "Brazil": "BRL",
}

DEPARTMENTS = ["Engineering", "Product", "Sales", "Marketing", "Finance", "HR", "Operations", "Support"]
MANAGER = "manager"
EMPLOYEE = "employee"
ROLES = (MANAGER, EMPLOYEE)