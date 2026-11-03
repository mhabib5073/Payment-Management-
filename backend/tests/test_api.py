from tests.conftest import employee_payload


def create(client, **overrides):
    response = client.post("/api/employees", json=employee_payload(**overrides))
    assert response.status_code == 201, response.text
    return response.json()


def test_create_and_fetch_employee(client):
    created = create(client)
    assert created["currency"] == "INR"
    fetched = client.get(f"/api/employees/{created['id']}").json()
    assert fetched["email"] == "priya.sharma@acme.com"


def test_invalid_payloads_return_422(client):
    assert client.post("/api/employees", json=employee_payload(salary=-5)).status_code == 422
    assert client.post("/api/employees", json=employee_payload(hire_date="2999-01-01")).status_code == 422
    assert client.post("/api/employees", json=employee_payload(email="not-an-email")).status_code == 422


def test_duplicate_email_returns_409(client):
    create(client)
    response = client.post("/api/employees", json=employee_payload())
    assert response.status_code == 409


def test_list_filters_searches_sorts_and_paginates(client):
    create(client, email="a@acme.com", first_name="Ana", country="India", salary=1_000_000)
    create(client, email="b@acme.com", first_name="Ben", country="India", salary=3_000_000)
    create(client, email="c@acme.com", first_name="Cal", country="Germany", salary=70_000)

    params = {"country": "India", "sort": "salary", "order": "desc"}
    india = client.get("/api/employees", params=params).json()
    assert india["total"] == 2
    assert [e["first_name"] for e in india["items"]] == ["Ben", "Ana"]

    assert client.get("/api/employees", params={"search": "cal"}).json()["total"] == 1

    page = client.get("/api/employees", params={"page": 2, "page_size": 2}).json()
    assert (page["total"], len(page["items"])) == (3, 1)


def test_update_and_delete(client):
    created = create(client)
    patched = client.patch(f"/api/employees/{created['id']}", json={"salary": 2_700_000})
    assert patched.json()["salary"] == 2_700_000

    assert client.delete(f"/api/employees/{created['id']}").status_code == 204
    assert client.get(f"/api/employees/{created['id']}").status_code == 404


def test_salary_insights_by_country_and_job_title(client):
    create(client, email="a@acme.com", salary=1_000_000)
    create(client, email="b@acme.com", salary=3_000_000)
    create(client, email="c@acme.com", country="Germany", salary=70_000)

    by_country = {s["group"]: s for s in client.get("/api/insights/salaries").json()}
    assert by_country["India"]["median_salary"] == 2_000_000
    assert by_country["Germany"]["currency"] == "EUR"

    titles = client.get("/api/insights/salaries", params={"group_by": "job_title", "country": "India"}).json()
    assert [(t["group"], t["headcount"]) for t in titles] == [("Software Engineer", 2)]


def test_meta_lists_dropdown_options(client):
    create(client)
    meta = client.get("/api/meta").json()
    assert meta["countries"]["India"] == "INR"
    assert "Software Engineer" in meta["job_titles"]