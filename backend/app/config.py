"""Runtime configuration, read from environment variables only.

Nothing secret is ever hard-coded: the Supabase URL and keys come from the
environment (Vercel project settings in production, a git-ignored `.env`
locally). See `.env.example`.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache


def _split(value: str) -> list[str]:
    return [part.strip().rstrip("/") for part in value.split(",") if part.strip()]


@dataclass(frozen=True)
class Settings:
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str
    cors_origins: list[str] = field(default_factory=list)
    # Preview deployments get a unique hostname; allow this project's pattern.
    cors_origin_regex: str = r"https://sparr[a-z0-9-]*\.vercel\.app"

    @property
    def configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_anon_key)


@lru_cache
def get_settings() -> Settings:
    return Settings(
        supabase_url=os.environ.get("SUPABASE_URL", "").rstrip("/"),
        supabase_anon_key=os.environ.get("SUPABASE_ANON_KEY", ""),
        supabase_service_role_key=os.environ.get("SUPABASE_SERVICE_ROLE_KEY", ""),
        cors_origins=_split(os.environ.get("CORS_ORIGINS", "http://localhost:3000")),
    )
