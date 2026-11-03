from fastapi import FastAPI


def create_app() -> FastAPI:
    app = FastAPI(title="ACME Salary Management")

    @app.get("/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()