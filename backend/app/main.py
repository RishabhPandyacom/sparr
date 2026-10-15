"""Sparr API: FastAPI service between the React frontend and Supabase."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import get_settings
from .routers import account, applications, career_plans, tools

VERSION = "1.0.0"


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Sparr API",
        version=VERSION,
        description="Career plans, salary tools, résumé readiness and the application tracker.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_origin_regex=settings.cors_origin_regex,
        allow_credentials=False,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    @app.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, exc: RequestValidationError):
        fields: dict[str, str] = {}
        for err in exc.errors():
            loc = [str(p) for p in err["loc"] if p not in ("body", "query", "path")]
            fields[".".join(loc) or "request"] = err["msg"].removeprefix("Value error, ")
        first = next(iter(fields.values()), "Invalid request.")
        return JSONResponse(status_code=422, content={"detail": first, "fields": fields})

    @app.get("/", include_in_schema=False)
    async def root():
        return {"service": "sparr-api", "version": VERSION, "docs": "/docs"}

    @app.get("/api/health", tags=["meta"])
    async def health():
        return {
            "status": "ok",
            "service": "sparr-api",
            "version": VERSION,
            "supabase_configured": settings.configured,
        }

    app.include_router(career_plans.router)
    app.include_router(tools.router)
    app.include_router(applications.router)
    app.include_router(account.router)
    return app


app = create_app()
