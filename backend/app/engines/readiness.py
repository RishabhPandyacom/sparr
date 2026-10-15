"""Résumé readiness score: a transparent, rule-based ATS-style check.

Every point maps to a named, inspectable check (the "traceable score" promised
in the product brief). Nothing here calls a language model, and nothing is
invented on the user's behalf: where something is missing the engine says what
to add, it never writes it for them.

Score = points earned / points available x 100, counting only the checks that
could be assessed (the job-description check is skipped when no posting is
pasted, rather than silently awarding or denying points).
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass

from .roles import RoleFamily, find_role, normalise_skill, parse_skills

ACTION_VERBS = frozenset(
    """achieved analysed analyzed architected automated built championed coached collaborated
    configured created cut debugged defined delivered deployed designed developed directed
    drove eliminated enabled engineered established evaluated executed expanded facilitated
    founded generated grew identified implemented improved increased initiated integrated
    introduced launched led managed mentored migrated modelled modeled negotiated optimised
    optimized orchestrated organised organized owned partnered planned presented prioritised
    prioritized produced published reduced refactored researched resolved restructured scaled
    shipped simplified solved spearheaded streamlined supported tested trained transformed
    wrote""".split()
)

_STOPWORDS = frozenset(
    """a about above across after all also an and any are as at be been being by can could
    do does for from had has have if in into is it its may more most must of on or our out
    over per should so some such than that the their them then there these they this those
    to under up us use used using via was we were what when where which while who will with
    within would you your role team work working experience ability strong required
    responsibilities requirements preferred including etc""".split()
)

_YEAR = re.compile(r"^(19|20)\d{2}$")
_NUMBER = re.compile(r"\$?\d[\d,]*(?:\.\d+)?\s?(?:%|k\b|m\b|x\b|\+)?", re.IGNORECASE)


@dataclass
class Check:
    id: str
    label: str
    points: int
    max_points: int
    passed: bool
    detail: str
    tip: str | None = None
    assessed: bool = True


@dataclass
class Readiness:
    score: int
    band: str
    role_family: str
    role_matched: bool
    checks: list[Check]
    matched_skills: list[str]
    missing_skills: list[str]
    jd_keywords_missing: list[str]

    def to_dict(self) -> dict:
        data = asdict(self)
        return data


def _band(score: int) -> str:
    if score >= 90:
        return "Offer-ready"
    if score >= 75:
        return "Interview-ready"
    if score >= 50:
        return "Building momentum"
    return "Getting started"


def _words(text: str) -> list[str]:
    return re.findall(r"[A-Za-z][A-Za-z+#.\-]*", text)


def _quantified_count(text: str) -> int:
    count = 0
    for match in _NUMBER.finditer(text):
        token = match.group().strip().rstrip(",")
        bare = re.sub(r"[^\d]", "", token)
        if not bare or _YEAR.match(bare) and token == bare:
            continue
        count += 1
    return count


def _verb_led_sentences(text: str) -> int:
    count = 0
    for sentence in re.split(r"[.\n!?•\-–]+", text):
        words = _words(sentence)
        if words and words[0].lower() in ACTION_VERBS:
            count += 1
    return count


def _jd_keywords(job_description: str, family: RoleFamily) -> list[str]:
    lowered = job_description.lower()
    found: dict[str, None] = {}
    for term in family.vocabulary:
        if re.search(rf"(?<![a-z]){re.escape(term.lower())}(?![a-z])", lowered):
            found.setdefault(term.lower(), None)
    frequency: dict[str, int] = {}
    for word in _words(lowered):
        word = word.strip(".-")
        if len(word) >= 4 and word not in _STOPWORDS:
            frequency[word] = frequency.get(word, 0) + 1
    for word, n in sorted(frequency.items(), key=lambda kv: (-kv[1], kv[0])):
        if n >= 2 and len(found) < 15:
            found.setdefault(word, None)
    return list(found)[:15]


def assess_readiness(
    *,
    target_role: str,
    key_skills: str | list[str],
    experience: str,
    job_description: str | None = None,
) -> Readiness:
    family, matched_role = find_role(target_role)
    skills = parse_skills(key_skills)
    normalised = {normalise_skill(s) for s in skills}

    vocabulary = [(term, normalise_skill(term)) for term in family.vocabulary]
    matched = [term for term, norm in vocabulary if norm in normalised]
    missing = [term for term, norm in vocabulary if norm not in normalised]
    needed = min(7, max(1, len(family.core_skills)))

    checks: list[Check] = []

    # 1. Role clarity ---------------------------------------------------------
    role_points = 10 if matched_role else 5
    checks.append(
        Check(
            "role_clarity",
            "Target role is specific",
            role_points,
            10,
            matched_role,
            f"Recognised as {family.label}." if matched_role else "Read as a general role.",
            None if matched_role else "Use a standard job title (e.g. “Data Analyst”) so ATS filters can classify you.",
        )
    )

    # 2. Core skills coverage ------------------------------------------------
    coverage = min(1.0, len(matched) / needed)
    cov_points = round(30 * coverage)
    checks.append(
        Check(
            "core_skills",
            f"Covers the core {family.label} skills",
            cov_points,
            30,
            coverage >= 0.7,
            f"{len(matched)} of the {needed} skills typically asked for are listed.",
            None if coverage >= 0.7 else "Add the skills you genuinely have from: " + ", ".join(missing[:5]) + ".",
        )
    )

    # 3. Skills breadth ------------------------------------------------------
    n = len(skills)
    breadth = 10 if n >= 10 else 7 if n >= 6 else 4 if n >= 3 else 1 if n >= 1 else 0
    checks.append(
        Check(
            "skills_breadth",
            "Lists enough skills",
            breadth,
            10,
            n >= 6,
            f"{n} skill{'s' if n != 1 else ''} listed.",
            None if n >= 6 else "Aim for 6–12 skills, grouped by type (languages, tools, practices).",
        )
    )

    # 4. Experience depth ----------------------------------------------------
    word_count = len(experience.split())
    depth = 15 if word_count >= 120 else 11 if word_count >= 70 else 6 if word_count >= 35 else 2 if word_count else 0
    checks.append(
        Check(
            "experience_depth",
            "Experience is described in enough detail",
            depth,
            15,
            word_count >= 70,
            f"{word_count} words describing your experience.",
            None if word_count >= 70 else "Describe 2–3 roles or projects: what you did, with what, and what changed.",
        )
    )

    # 5. Quantified impact ---------------------------------------------------
    numbers = _quantified_count(experience)
    impact = 20 if numbers >= 4 else 15 if numbers == 3 else 10 if numbers == 2 else 5 if numbers == 1 else 0
    checks.append(
        Check(
            "quantified_impact",
            "Shows measurable results",
            impact,
            20,
            numbers >= 3,
            f"{numbers} measurable figure{'s' if numbers != 1 else ''} found.",
            None
            if numbers >= 3
            else "Add real numbers you can defend: time saved, users, revenue, error rate, team size.",
        )
    )

    # 6. Action verbs --------------------------------------------------------
    verb_led = _verb_led_sentences(experience)
    verbs = 10 if verb_led >= 4 else 7 if verb_led == 3 else 4 if verb_led == 2 else 2 if verb_led == 1 else 0
    checks.append(
        Check(
            "action_verbs",
            "Starts achievements with action verbs",
            verbs,
            10,
            verb_led >= 3,
            f"{verb_led} achievement line{'s' if verb_led != 1 else ''} open with a strong verb.",
            None if verb_led >= 3 else "Start each line with a verb: built, reduced, led, shipped, negotiated.",
        )
    )

    # 7. Job-description alignment (only when a posting is provided) ----------
    jd_missing: list[str] = []
    if job_description and job_description.strip():
        keywords = _jd_keywords(job_description, family)
        haystack = " ".join([target_role, " ".join(skills), experience]).lower()
        hits = [k for k in keywords if re.search(rf"(?<![a-z]){re.escape(k)}(?![a-z])", haystack)]
        jd_missing = [k for k in keywords if k not in hits]
        fraction = len(hits) / len(keywords) if keywords else 1.0
        checks.append(
            Check(
                "jd_alignment",
                "Matches the job posting's keywords",
                round(5 * fraction),
                5,
                fraction >= 0.6,
                f"{len(hits)} of {len(keywords)} posting keywords appear in your profile.",
                None
                if fraction >= 0.6
                else "Work these in where they are true for you: " + ", ".join(jd_missing[:6]) + ".",
            )
        )
    else:
        checks.append(
            Check(
                "jd_alignment",
                "Matches the job posting's keywords",
                0,
                5,
                False,
                "Not assessed: no job posting was pasted.",
                "Paste the posting you are applying to for a keyword match.",
                assessed=False,
            )
        )

    earned = sum(c.points for c in checks if c.assessed)
    available = sum(c.max_points for c in checks if c.assessed)
    score = round(100 * earned / available) if available else 0

    return Readiness(
        score=score,
        band=_band(score),
        role_family=family.label,
        role_matched=matched_role,
        checks=checks,
        matched_skills=matched,
        missing_skills=missing,
        jd_keywords_missing=jd_missing,
    )
