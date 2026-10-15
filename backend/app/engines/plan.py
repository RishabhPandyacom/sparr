"""Career action plan: turns the readiness check and salary estimate into steps.

Ordering is rule-based and explained: weakest résumé checks come first (they
gate every application), then interview practice, then negotiation prep. Each
step links to the Sparr module that does the work.
"""

from __future__ import annotations

from typing import Any

from .readiness import Readiness
from .salary import SYMBOL, SalaryEstimate
from .script import Script

DISCLAIMER = (
    "Sparr's guidance comes from transparent rules, not a language model, and uses illustrative "
    "baselines rather than live market data. It is general information, not professional advice."
)


def _step(
    id_: str, title: str, why: str, horizon: str, priority: str, href: str, minutes: int
) -> dict[str, Any]:
    return {
        "id": id_,
        "title": title,
        "why": why,
        "horizon": horizon,
        "priority": priority,
        "href": href,
        "est_minutes": minutes,
    }


def build_plan(
    *,
    target_role: str,
    readiness: Readiness,
    salary: SalaryEstimate,
    script: Script,
    current_offer: float | None,
    target_salary: float | None,
) -> dict[str, Any]:
    cur = SYMBOL.get(salary.currency, "")
    failing = [c for c in readiness.checks if c.assessed and not c.passed]
    steps: list[dict[str, Any]] = []

    # Résumé: the weakest assessed checks first.
    for check in sorted(failing, key=lambda c: (c.points - c.max_points, c.id))[:3]:
        steps.append(
            _step(
                f"fix-{check.id}",
                f"Fix: {check.label.lower()}",
                check.tip or check.detail,
                "This week",
                "high",
                "/dashboard/resumes/generate",
                20,
            )
        )

    if readiness.missing_skills and not any(s["id"] == "fix-core_skills" for s in steps):
        steps.append(
            _step(
                "add-skills",
                "Add the skills you genuinely have",
                "Roles like this usually mention: " + ", ".join(readiness.missing_skills[:5]) + ".",
                "This week",
                "medium",
                "/dashboard/resumes",
                15,
            )
        )

    steps.append(
        _step(
            "tailor-cover-letter",
            f"Write a tailored cover letter for your first {target_role} application",
            "A letter that mirrors the posting's own words lifts your chances through the first screen.",
            "Next 2 weeks",
            "medium",
            "/dashboard/cover-letters/new",
            25,
        )
    )
    steps.append(
        _step(
            "mock-interviews",
            "Complete three mock interviews on the same question type",
            "Sparr measures progress by comparing your feedback scores across your first three attempts.",
            "Next 2 weeks",
            "high" if readiness.score >= 50 else "medium",
            "/dashboard/interviews/new",
            45,
        )
    )
    steps.append(
        _step(
            "track-applications",
            "Log every application you send",
            "Seeing your pipeline in one place shows what is working and when to follow up.",
            "Next 2 weeks",
            "low",
            "/dashboard/applications",
            10,
        )
    )
    steps.append(
        _step(
            "prepare-negotiation",
            f"Prepare your negotiation: ask for {cur}{salary.recommended_ask:,}",
            salary.offer_comment if current_offer else "Know your range and your walk-away number before an offer arrives.",
            "Before an offer",
            "high" if salary.offer_position == "below" else "medium",
            "/dashboard/salary-negotiator",
            30,
        )
    )

    for position, step in enumerate(steps, start=1):
        step["order"] = position

    headline = (
        f"You're {readiness.band.lower()} for {readiness.role_family.lower()} roles "
        f"with a readiness score of {readiness.score}/100."
    )

    return {
        "method": "rule-based",
        "headline": headline,
        "band": readiness.band,
        "readiness": readiness.to_dict(),
        "salary": salary.to_dict(),
        "script": script.to_dict(),
        "steps": steps,
        "disclaimer": DISCLAIMER,
    }
