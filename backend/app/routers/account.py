"""Data rights: export everything we hold about you, or delete your account.

These exist because the product collects career and salary data. A production
Australian service should let people see, correct and erase it (Privacy Act 1988,
Australian Privacy Principles 12 and 13 and the retention duties in APP 11).
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Response

from ..auth import AuthUser, get_current_user
from ..config import Settings, get_settings
from ..db import Database, get_db
from ..schemas import DeleteAccountRequest

router = APIRouter(prefix="/api/me", tags=["account"])

# Tables holding rows owned by the user, and the column that identifies them.
USER_TABLES: list[tuple[str, str]] = [
    ("profiles", "id"),
    ("career_plans", "user_id"),
    ("applications", "user_id"),
    ("resumes", "user_id"),
    ("cover_letters", "user_id"),
    ("interview_sessions", "user_id"),
    ("notifications", "user_id"),
    ("user_subscriptions", "user_id"),
    ("usage_credits", "user_id"),
]


@router.get("/export")
async def export_my_data(user: AuthUser = Depends(get_current_user), db: Database = Depends(get_db)):
    bundle: dict = {
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "account": {"id": user.id, "email": user.email},
        "note": "Everything Sparr stores about you, as JSON.",
    }
    for table, column in USER_TABLES:
        bundle[table] = await db.select(table, filters={column: user.id})
    body = json.dumps(bundle, indent=2, default=str)
    return Response(
        content=body,
        media_type="application/json",
        headers={"Content-Disposition": 'attachment; filename="sparr-my-data.json"'},
    )


@router.delete("", status_code=204)
async def delete_my_account(
    body: DeleteAccountRequest,
    user: AuthUser = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Permanently delete the signed-in user. Database rows cascade from auth.users."""
    if not settings.supabase_service_role_key:
        raise HTTPException(status_code=503, detail="Account deletion is not configured.")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            res = await client.delete(
                f"{settings.supabase_url}/auth/v1/admin/users/{user.id}",
                headers={
                    "apikey": settings.supabase_service_role_key,
                    "Authorization": f"Bearer {settings.supabase_service_role_key}",
                },
            )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Could not reach the auth service.") from exc
    if res.status_code >= 400:
        raise HTTPException(status_code=502, detail="Could not delete the account. Please try again.")
    return Response(status_code=204)
