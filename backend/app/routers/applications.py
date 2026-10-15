"""Job application tracker: simple CRUD scoped to the signed-in user."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response

from ..auth import AuthUser, get_current_user
from ..db import Database, get_db
from ..schemas import ApplicationCreate, ApplicationUpdate

router = APIRouter(prefix="/api/applications", tags=["applications"])
TABLE = "applications"


@router.get("")
async def list_applications(user: AuthUser = Depends(get_current_user), db: Database = Depends(get_db)):
    return await db.select(TABLE, filters={"user_id": user.id}, order="updated_at.desc", limit=500)


@router.post("", status_code=201)
async def create_application(
    body: ApplicationCreate, user: AuthUser = Depends(get_current_user), db: Database = Depends(get_db)
):
    row: dict[str, Any] = {"user_id": user.id, **body.model_dump(exclude_none=True)}
    return await db.insert(TABLE, row)


@router.patch("/{application_id}")
async def update_application(
    application_id: str,
    body: ApplicationUpdate,
    user: AuthUser = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    values = body.model_dump(exclude_unset=True)
    if not values:
        raise HTTPException(status_code=400, detail="Nothing to update.")
    updated = await db.update(TABLE, {"id": application_id, "user_id": user.id}, values)
    if not updated:
        raise HTTPException(status_code=404, detail="That application was not found.")
    return updated[0]


@router.delete("/{application_id}", status_code=204)
async def delete_application(
    application_id: str, user: AuthUser = Depends(get_current_user), db: Database = Depends(get_db)
):
    deleted = await db.delete(TABLE, {"id": application_id, "user_id": user.id})
    if not deleted:
        raise HTTPException(status_code=404, detail="That application was not found.")
    return Response(status_code=204)
