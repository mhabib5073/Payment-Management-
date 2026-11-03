from app.constants import COUNTRY_CURRENCY
from scripts.seed import generate_employees


def test_seed_is_deterministic():
    assert generate_employees(50, seed=7) == generate_employees(50, seed=7)


def test_seed_produces_valid_unique_employees():
    rows = generate_employees(10_000)
    assert len(rows) == 10_000
    assert len({r["email"] for r in rows}) == 10_000
    assert all(COUNTRY_CURRENCY[r["country"]] == r["currency"] for r in rows)
    assert all(r["salary"] > 0 for r in rows)