# Requirements: ACME Salary Management

## Goal

Replace the spreadsheets ACME's HR team uses for 10,000 employees across several countries with a web application where the **HR Manager** can (1) keep employee salary records accurate and (2) answer *"how does the org pay people?"* in seconds instead of hours of Excel work.

**Success looks like:** the HR Manager can find any employee in under 5 seconds, change a salary in a few clicks with validation preventing bad data, and see pay ranges per country, job title and department without exporting anything.

## Users

One persona: the **HR Manager**, trusted to view and edit all salary data. Comfortable with spreadsheets, not technical.

## Scope & features (MVP)

| # | Feature | Why it matters |
|---|---|---|
| 1 | **Employee directory**: server-side paginated table of 10,000 employees with search (name/email), filters (country, department) and sorting (name, salary, hire date, country, job title) | The everyday "find the record" task; must stay fast at 10k rows |
| 2 | **Add, edit, delete employees**: name, email, job title, department, country, annual salary, hire date | Core salary maintenance that Excel does today |
| 3 | **Validation**: unique email, positive salary, no future hire dates, supported countries only | Spreadsheets let bad data in silently |
| 4 | **Currency derived from country** (India → INR, Germany → EUR...) | Removes a whole class of input errors |
| 5 | **Pay insights by country**: headcount, min, median, average, max salary | The headline "how do we pay people" question |
| 6 | **Breakdown within a country** by job title or department | Answers "what do engineers earn in India?" and spots outliers |
| 7 | **Seed script** generating 10,000 realistic, reproducible employees | Realistic demo and performance testing |

**Non-functional:** list and insight responses under 200 ms at 10,000 employees; fast, deterministic automated tests for core logic; one-command local setup; deployed demo.

## Deliberately left out (and why)

| Left out | Reasoning |
|---|---|
| **Currency conversion / org-wide totals in one currency** | Exchange rates change daily; mixing currencies with a stale rate would give HR confidently wrong answers. Stats are grouped per country, so each figure is in one real currency. |
| **Authentication and roles** | Single trusted persona for this exercise. The service layer is structured so an auth dependency can be added without changing business logic. |
| **Salary history, approvals, audit trail** | Valuable, but it needs a separate history model and workflow. Out of the MVP to keep the core reliable; first item for the next iteration. |
| **Excel/CSV import and export** | Migration is a one-off task the seed script covers for the demo; a robust importer needs error-reporting UX of its own. |
| **Payroll, tax, bonuses, benefits** | A different product (payroll processing) with country-specific legal rules. |
| **Charts and dashboards** | Sortable tables answer the questions precisely; charts can be added on top of the same API. |
| **Multi-tenant, i18n, mobile app** | One organisation, one persona, desktop use. |

## Assumptions

Salaries are annual gross in whole units of local currency. Each employee works in exactly one country. Deleting an employee removes the record (no soft delete). SQLite is sufficient for 10,000 rows and a single HR user; the data layer uses SQLAlchemy so moving to PostgreSQL is a configuration change.

## Next iteration

Salary history with effective dates, authentication with read-only and editor roles, CSV import/export, and optional reporting in a base currency using dated exchange rates.
