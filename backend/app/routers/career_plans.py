"""The guided career journey: Resume -> Salary -> Career Summary.

Each step is saved to Supabase as soon as it is submitted (so a refresh or a
second device never loses progress), and the final step runs the engines and
stores the generated plan beside the inputs.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response

from ..auth import AuthUser, get_current_user
from ..db import Database, get_db
from ..engines.plan import build_plan
from ..engines.readiness import assess_readiness
from ..engines.salary import estimate_salary
from ..engines.script import build_script
from ..schemas import PlanCreate, ResumeInput, SalaryInput

router = APIRouter(prefix="/api/career-plans", tags=["career plans"])

TABLE = "career_plans"


async def _owned_plan(db: Database, user: AuthUser, plan_id: str) -> dict[str, Any]:
    rows = await db.select(TABLE, filters={"id": plan_id, "user_id": user.id}, limit=1)
    if not rows:
        raise HTTPException(status_code=404, detail="That career plan was not found.")
    return rows[0]


@router.get("")
async def list_plans(user: AuthUser = Depends(get_current_user), db: Database = Depends(get_db)):
    return await db.select(TABLE, filters={"user_id": user.id}, order="updated_at.desc", limit=50)


@router.post("", status_code=201)
async def create_plan(
    body: PlanCreate | None = None,
    user: AuthUser = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    title = (body.title if body else None) or "My career plan"
    return await db.insert(TABLE, {"user_id": user.id, "title": title, "status": "draft", "current_step": 1})


@router.get("/latest")
async def latest_plan(user: AuthUser = Depends(get_current_user), db: Database = Depends(get_db)):
    rows = await db.select(TABLE, filters={"user_id": user.id}, order="updated_at.desc", limit=1)
    return rows[0] if rows else None


@router.get("/{plan_id}")
async def get_plan(plan_id: str, user: AuthUser = Depends(get_current_user), db: Database = Depends(get_db)):
    return await _owned_plan(db, user, plan_id)


@router.put("/{plan_id}/resume")
async def save_resume_step(
    plan_id: str,
    body: ResumeInput,
    user: AuthUser = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    plan = await _owned_plan(db, user, plan_id)
    values: dict[str, Any] = {
        "resume_data": body.model_dump(),
        "current_step": max(plan["current_step"], 2),
        "status": "draft",
        "plan": None,
        "readiness_score": None,
    }
    updated = await db.update(TABLE, {"id": plan_id, "user_id": user.id}, values)
    return updated[0]


@router.put("/{plan_id}/salary")
async def save_salary_step(
    plan_id: str,
    body: SalaryInput,
    user: AuthUser = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    plan = await _owned_plan(db, user, plan_id)
    if not plan["resume_data"]:
        raise HTTPException(status_code=409, detail="Complete the résumé step first.")
    values: dict[str, Any] = {
        "salary_data": body.model_dump(),
        "current_step": 3,
        "status": "draft",
        "plan": None,
        "readiness_score": None,
    }
    updated = await db.update(TABLE, {"id": plan_id, "user_id": user.id}, values)
    return updated[0]


@router.post("/{plan_id}/generate")
async def generate_plan(
    plan_id: str,
    user: AuthUser = Depends(get_current_user),
    db: Database = Depends(get_db),
):
    plan = await _owned_plan(db, user, plan_id)
    if not plan["resume_data"] or not plan["salary_data"]:
        missing = [name for name, key in (("résumé", "resume_data"), ("salary", "salary_data")) if not plan[key]]
        raise HTTPException(
            status_code=409, detail=f"Finish the {' and '.join(missing)} step before generating your plan."
        )

    resume = ResumeInput(**plan["resume_data"])
    salary_in = SalaryInput(**plan["salary_data"])

    readiness = assess_readiness(
        target_role=resume.target_role,
        key_skills=resume.key_skills,
        experience=resume.experience,
        job_description=resume.job_description,
    )
    estimate = estimate_salary(
        role=resume.target_role,
        location=salary_in.location,
        experience_years=resume.years_experience,
        currency=salary_in.currency,
        current_offer=salary_in.current_offer,
        target_salary=salary_in.target_salary,
    )
    script = build_script(
        role=resume.target_role,
        style=salary_in.strategy,
        estimate=estimate,
        current_offer=salary_in.current_offer,
    )
    result = build_plan(
        target_role=resume.target_role,
        readiness=readiness,
        salary=estimate,
        script=script,
        current_offer=salary_in.current_offer,
        target_salary=salary_in.target_salary,
    )

    updated = await db.update(
        TABLE,
        {"id": plan_id, "user_id": user.id},
        {"plan": result, "readiness_score": readiness.score, "status": "complete", "current_step": 3},
    )
    return updated[0]


@router.delete("/{plan_id}", status_code=204)
async def delete_plan(plan_id: str, user: AuthUser = Depends(get_current_user), db: Database = Depends(get_db)):
    await _owned_plan(db, user, plan_id)
    await db.delete(TABLE, {"id": plan_id, "user_id": user.id})
    return Response(status_code=204)
