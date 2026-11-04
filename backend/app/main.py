
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import func, select

from app.api import auth, employees, insights
from app import models  # noqa: F401  (registers tables)
from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.models import Employee
from app.services.errors import DomainError


async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    if get_settings().seed_on_startup:
        with SessionLocal() as db:
            empty = db.scalar(select(func.count()).select_from(Employee)) == 0
        if empty:
            from scripts.seed import seed

            seed(count=10_000, seed_value=42, reset=False)
    yield

def create_app() -> FastAPI:
    app = FastAPI(title="ACME Salary Management", version="1.0.0", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in get_settings().cors_origins.split(",")],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(DomainError)
    async def handle_domain_error(_: Request, exc: DomainError):
        return JSONResponse(status_code=exc.status_code, content={"detail": str(exc)})

    @app.get("/health", tags=["Health"])
    def health():
        return {"status": "ok"}

    app.include_router(auth.router)
    app.include_router(employees.router)
    app.include_router(insights.router)

    static_dir = get_settings().static_dir
    if static_dir:  # must be mounted last so /api routes win
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="ui")
    return app
app = create_app()
