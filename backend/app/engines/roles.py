"""Role knowledge base shared with the TypeScript résumé generator.

`app/data/roles.json` is exported from `src/lib/resume/roleLibrary.ts`
(`npx tsx scripts/export-roles.ts`), so the frontend's résumé generator and this
backend's readiness engine reason from the same 25 role families.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

_DATA = Path(__file__).resolve().parent.parent / "data" / "roles.json"

# Common ways people write the same skill. Keys and values are lowercase.
SKILL_ALIASES: dict[str, str] = {
    "js": "javascript",
    "ts": "typescript",
    "reactjs": "react",
    "react.js": "react",
    "node": "node.js",
    "nodejs": "node.js",
    "postgres": "postgresql",
    "k8s": "kubernetes",
    "ml": "machine learning",
    "gcp": "google cloud",
    "ci/cd": "ci/cd",
    "powerbi": "power bi",
    "ms excel": "excel",
    "microsoft excel": "excel",
    "gen ai": "generative ai",
}


@dataclass(frozen=True)
class RoleFamily:
    id: str
    label: str
    aliases: tuple[str, ...]
    core_skills: tuple[str, ...]
    tools: tuple[str, ...]

    @property
    def vocabulary(self) -> tuple[str, ...]:
        seen: dict[str, None] = {}
        for term in (*self.core_skills, *self.tools):
            seen.setdefault(term, None)
        return tuple(seen)


@lru_cache
def load_roles() -> tuple[RoleFamily, ...]:
    raw = json.loads(_DATA.read_text(encoding="utf-8"))
    return tuple(
        RoleFamily(
            id=item["id"],
            label=item["label"],
            aliases=tuple(a.lower() for a in item["aliases"]),
            core_skills=tuple(item["core_skills"]),
            tools=tuple(item["tools"]),
        )
        for item in raw
    )


def find_role(text: str) -> tuple[RoleFamily, bool]:
    """Best-matching role family for a free-text job title.

    Returns (family, matched). `matched` is False when we fell back to the
    generalist family, so callers can say so instead of pretending certainty.
    """
    lowered = text.lower()
    best: RoleFamily | None = None
    best_len = 0
    for family in load_roles():
        for alias in family.aliases:
            if re.search(rf"(?<![a-z]){re.escape(alias)}(?![a-z])", lowered) and len(alias) > best_len:
                best, best_len = family, len(alias)
    if best is not None:
        return best, True
    generalist = next(f for f in load_roles() if f.id == "generalist")
    return generalist, False


def normalise_skill(skill: str) -> str:
    cleaned = re.sub(r"\s+", " ", skill.strip().lower())
    return SKILL_ALIASES.get(cleaned, cleaned)


def parse_skills(raw: str | list[str]) -> list[str]:
    """Split free text ("Python, SQL; Tableau\\n- Excel") into unique skills."""
    if isinstance(raw, list):
        parts = raw
    else:
        parts = re.split(r"[,\n;|•·]+", raw)
    seen: dict[str, str] = {}
    for part in parts:
        original = re.sub(r"^[\s\-–*•\d.)]+", "", part).strip()
        if not original:
            continue
        seen.setdefault(normalise_skill(original), original)
    return list(seen.values())
