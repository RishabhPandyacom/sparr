"""Authentication: every protected route requires a Supabase access token.

The frontend signs the user in with Supabase Auth and sends the resulting JWT
as `Authorization: Bearer <token>`. This API never sees a password. It asks
Supabase who the token belongs to (`GET /auth/v1/user`), so verification stays
correct whichever signing algorithm the project uses and a revoked session stops
working immediately.
"""

from __future__ import annotations

import hashlib
import time
from dataclasses import dataclass

import httpx
from fastapi import Depends, Header, HTTPException, status

from .config import Settings, get_settings

_CACHE_TTL_SECONDS = 60
_CACHE_MAX = 512
_cache: dict[str, tuple[float, "AuthUser"]] = {}


@dataclass(frozen=True)
class AuthUser:
    id: str
    email: str | None
    token: str


def _cache_key(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


async def get_current_user(
    authorization: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> AuthUser:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token. Sign in to continue.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Empty bearer token.")

    key = _cache_key(token)
    hit = _cache.get(key)
    now = time.monotonic()
    if hit and hit[0] > now:
        return hit[1]

    if not settings.configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The API is not configured with a Supabase project.",
        )

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            res = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={"apikey": settings.supabase_anon_key, "Authorization": f"Bearer {token}"},
            )
    except httpx.HTTPError as exc:  # network problem reaching Supabase
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Could not reach the auth service."
        ) from exc

    if res.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    body = res.json()
    user = AuthUser(id=body["id"], email=body.get("email"), token=token)
    if len(_cache) >= _CACHE_MAX:
        _cache.clear()
    _cache[key] = (now + _CACHE_TTL_SECONDS, user)
    return user
