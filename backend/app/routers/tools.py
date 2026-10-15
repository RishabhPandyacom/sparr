"""Stateless tools: salary estimate + script, and the résumé readiness check.

These never write to the database. They back the standalone Salary Negotiator
and the live readiness preview on the career-plan form.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from ..auth import AuthUser, get_current_user
from ..engines.readiness import assess_readiness
from ..engines.salary import estimate_salary
from ..engines.script import STYLES, build_script
from ..schemas import EstimateRequest, ReadinessRequest

router = APIRouter(prefix="/api", tags=["tools"])


@router.post("/salary/estimate")
async def salary_estimate(body: EstimateRequest, _user: AuthUser = Depends(get_current_user)):
    estimate = estimate_salary(
        role=body.role,
        location=body.location,
        experience_years=body.experience_years,
        currency=body.currency,
        current_offer=body.current_offer,
        target_salary=body.target_salary,
    )
    script = build_script(
        role=body.role, style=body.strategy, estimate=estimate, current_offer=body.current_offer
    )
    return {"estimate": estimate.to_dict(), "script": script.to_dict(), "styles": STYLES}


@router.post("/resume/readiness")
async def resume_readiness(body: ReadinessRequest, _user: AuthUser = Depends(get_current_user)):
    return assess_readiness(
        target_role=body.target_role,
        key_skills=body.key_skills,
        experience=body.experience,
        job_description=body.job_description,
    ).to_dict()
