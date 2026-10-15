"""Database access: a thin PostgREST client for Supabase.

Requests are made with the signed-in user's own JWT plus the public anon key,
so Postgres Row Level Security is enforced on every query. This API cannot read
another user's rows even if a route were written carelessly. The service-role
key is never used here (only for account deletion, see `account.py`).

`Database` is a small interface so the routes can be tested against an
in-memory implementation (`tests/memory_db.py`) with no network.
"""

from __future__ import annotations

from typing import Any, Protocol

import httpx
from fastapi import Depends, HTTPException

from .auth import AuthUser, get_current_user
from .config import Settings, get_settings

Row = dict[str, Any]


class Database(Protocol):
    async def select(
        self,
        table: str,
        *,
        filters: dict[str, Any] | None = None,
        order: str | None = None,
        limit: int | None = None,
    ) -> list[Row]: ...

    async def insert(self, table: str, row: Row) -> Row: ...

    async def update(self, table: str, filters: dict[str, Any], values: Row) -> list[Row]: ...

    async def delete(self, table: str, filters: dict[str, Any]) -> int: ...


class SupabaseDB:
    """PostgREST over HTTPS, authenticated as the end user."""

    def __init__(self, settings: Settings, user: AuthUser) -> None:
        self._base = f"{settings.supabase_url}/rest/v1"
        self._headers = {
            "apikey": settings.supabase_anon_key,
            "Authorization": f"Bearer {user.token}",
            "Content-Type": "application/json",
        }

    @staticmethod
    def _params(filters: dict[str, Any] | None) -> dict[str, str]:
        return {column: f"eq.{value}" for column, value in (filters or {}).items()}

    async def _request(self, method: str, table: str, *, params=None, json=None, prefer=None):
        headers = dict(self._headers)
        if prefer:
            headers["Prefer"] = prefer
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                res = await client.request(
                    method, f"{self._base}/{table}", params=params, json=json, headers=headers
                )
        except httpx.HTTPError as exc:
            raise HTTPException(status_code=502, detail="Could not reach the database.") from exc
        if res.status_code >= 400:
            detail = "Database request failed."
            try:
                detail = res.json().get("message", detail)
            except ValueError:
                pass
            raise HTTPException(
                status_code=400 if res.status_code < 500 else 502, detail=detail
            )
        return res

    async def select(self, table, *, filters=None, order=None, limit=None):
        params: dict[str, str] = {"select": "*", **self._params(filters)}
        if order:
            params["order"] = order
        if limit:
            params["limit"] = str(limit)
        res = await self._request("GET", table, params=params)
        return res.json()

    async def insert(self, table, row):
        res = await self._request("POST", table, json=row, prefer="return=representation")
        return res.json()[0]

    async def update(self, table, filters, values):
        res = await self._request(
            "PATCH", table, params=self._params(filters), json=values, prefer="return=representation"
        )
        return res.json()

    async def delete(self, table, filters):
        res = await self._request(
            "DELETE", table, params=self._params(filters), prefer="return=representation"
        )
        return len(res.json())


async def get_db(
    user: AuthUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
) -> Database:
    return SupabaseDB(settings, user)
