"""Salary estimator: transparent and rule-based.

The estimate is built from three visible multipliers (role baseline x market x
experience). The breakdown is returned with the number so a user can see, and
argue with, every step. These are coarse illustrative baselines, **not live
market data**, and every response says so.
"""

from __future__ import annotations

import re
from dataclasses import asdict, dataclass

from .roles import find_role

# Mid-level (~3 years) total-compensation baselines in USD, by role family.
ROLE_BASELINE_USD: dict[str, int] = {
    "software": 135_000, "frontend": 125_000, "mobile": 135_000, "devops": 145_000,
    "data-science": 150_000, "data-analyst": 90_000, "data-engineer": 140_000,
    "security": 140_000, "qa": 100_000, "product": 140_000, "design": 115_000,
    "marketing": 85_000, "sales": 85_000, "customer": 70_000, "finance": 95_000,
    "consulting": 110_000, "operations": 85_000, "hr": 80_000, "project": 100_000,
    "education": 65_000, "healthcare": 80_000, "research": 100_000, "legal": 120_000,
    "writing": 75_000, "generalist": 80_000,
}

# Seniority words in the job title scale the baseline.
SENIORITY: list[tuple[tuple[str, ...], float, str]] = [
    (("principal", "staff", "head of", "director"), 1.55, "Principal / staff level"),
    (("senior", "sr", "lead", "manager"), 1.25, "Senior level"),
    (("intern", "internship"), 0.5, "Internship"),
    (("graduate", "junior", "jr", "entry"), 0.8, "Graduate / junior level"),
]

# Market = where the job is. Factors express local pay as a share of the US
# baseline, in USD terms, then city factors adjust within the market.
MARKETS: dict[str, dict] = {
    "AU": {"label": "Australia", "factor": 0.62, "cities": {
        "sydney": 1.07, "melbourne": 1.0, "brisbane": 0.95, "perth": 0.97,
        "canberra": 1.0, "adelaide": 0.9, "gold coast": 0.92,
    }},
    "US": {"label": "United States", "factor": 1.0, "cities": {
        "san francisco": 1.35, "bay area": 1.35, "new york": 1.25, "seattle": 1.15,
        "boston": 1.15, "los angeles": 1.15, "austin": 1.05, "denver": 1.05, "chicago": 1.05,
    }},
    "UK": {"label": "United Kingdom", "factor": 0.60, "cities": {"london": 1.15, "manchester": 0.92}},
    "IN": {"label": "India", "factor": 0.28, "cities": {
        "bangalore": 1.15, "bengaluru": 1.15, "mumbai": 1.1, "delhi": 1.05, "hyderabad": 1.05,
    }},
}
COUNTRY_WORDS: dict[str, str] = {
    "australia": "AU", "aus": "AU", "united states": "US", "usa": "US", "america": "US",
    "united kingdom": "UK", "uk": "UK", "england": "UK", "india": "IN",
}
CURRENCY_DEFAULT_MARKET = {"AUD": "AU", "USD": "US", "GBP": "UK"}

# Display-currency conversion from USD. An assumption, shown to the user.
USD_TO: dict[str, float] = {"USD": 1.0, "AUD": 1.52, "GBP": 0.78}
SYMBOL = {"USD": "US$", "AUD": "A$", "GBP": "£"}


@dataclass
class Step:
    label: str
    value: str
    effect: str


@dataclass
class SalaryEstimate:
    currency: str
    low: int
    mid: int
    high: int
    recommended_ask: int
    walk_away: int
    market: str
    role_family: str
    seniority_label: str | None
    target_position: str  # "below" | "within" | "above" | "unset"
    target_comment: str
    offer_position: str  # "below" | "within" | "above" | "unset"
    offer_comment: str
    breakdown: list[Step]
    assumptions: list[str]

    def to_dict(self) -> dict:
        return asdict(self)


def _round_k(value: float) -> int:
    return int(round(value / 1000.0) * 1000)


def detect_market(location: str, currency: str) -> tuple[str, float, str]:
    """Return (market code, city factor, matched place) for a free-text location."""
    lowered = location.lower()
    for code, market in MARKETS.items():
        for city, factor in market["cities"].items():
            if re.search(rf"(?<![a-z]){re.escape(city)}(?![a-z])", lowered):
                return code, factor, city.title()
    for word, code in COUNTRY_WORDS.items():
        if re.search(rf"(?<![a-z]){re.escape(word)}(?![a-z])", lowered):
            return code, 1.0, MARKETS[code]["label"]
    return CURRENCY_DEFAULT_MARKET.get(currency, "US"), 1.0, "your market"


def experience_multiplier(years: int) -> float:
    """About +6% per year around a 3-year midpoint, gently capped at 15 years."""
    bounded = max(0, min(years, 15))
    return round(1 + (bounded - 3) * 0.06, 4)


def estimate_salary(
    *,
    role: str,
    location: str,
    experience_years: int,
    currency: str = "AUD",
    current_offer: float | None = None,
    target_salary: float | None = None,
) -> SalaryEstimate:
    family, matched = find_role(role)
    base_usd = ROLE_BASELINE_USD.get(family.id, 80_000)

    lowered_role = role.lower()
    seniority_factor, seniority_label = 1.0, None
    for words, factor, label in SENIORITY:
        if any(re.search(rf"(?<![a-z]){re.escape(w)}(?![a-z])", lowered_role) for w in words):
            seniority_factor, seniority_label = factor, label
            break

    market_code, city_factor, place = detect_market(location, currency)
    market = MARKETS[market_code]
    exp_factor = experience_multiplier(experience_years)
    fx = USD_TO.get(currency, 1.0)

    mid_usd = base_usd * seniority_factor * market["factor"] * city_factor * exp_factor
    mid = _round_k(mid_usd * fx)
    low = _round_k(mid * 0.85)
    high = _round_k(mid * 1.20)

    offer_floor = (current_offer or 0) * 1.10
    recommended = _round_k(max(offer_floor, mid * 1.08))
    walk_away = _round_k(max(low, (current_offer or 0) * 1.02))

    symbol = SYMBOL.get(currency, "")

    def fmt(n: float) -> str:
        return f"{symbol}{int(n):,}"

    if target_salary:
        if target_salary > high * 1.05:
            target_position = "above"
            target_comment = (
                f"Your target of {fmt(target_salary)} sits above this range. It is not impossible, "
                "but you will need specific evidence (competing offers, rare skills, scope)."
            )
        elif target_salary < low:
            target_position = "below"
            target_comment = (
                f"Your target of {fmt(target_salary)} is below the typical range. "
                "You may be underselling yourself."
            )
        else:
            target_position = "within"
            target_comment = f"Your target of {fmt(target_salary)} is inside a realistic range."
    else:
        target_position, target_comment = "unset", "No target salary was entered."

    if current_offer:
        if current_offer < low:
            offer_position = "below"
            offer_comment = f"The offer of {fmt(current_offer)} is below the typical range, so there is room to negotiate."
        elif current_offer > high:
            offer_position = "above"
            offer_comment = f"The offer of {fmt(current_offer)} is already above the typical range. Focus on the rest of the package."
        else:
            offer_position = "within"
            offer_comment = f"The offer of {fmt(current_offer)} is inside the typical range; a modest counter is reasonable."
    else:
        offer_position, offer_comment = "unset", "No offer was entered."

    breakdown = [
        Step("Role baseline", fmt(base_usd * fx), f"{family.label}, mid-level (~3 yrs), US baseline converted to {currency}"),
        Step("Seniority", f"x{seniority_factor:.2f}", seniority_label or "No seniority keyword in the title"),
        Step("Market", f"x{market['factor']:.2f}", f"{market['label']} pay relative to the US baseline"),
        Step("City", f"x{city_factor:.2f}", f"{place}" if city_factor != 1.0 or place != "your market" else "No specific city recognised"),
        Step("Experience", f"x{exp_factor:.2f}", f"{experience_years} year{'s' if experience_years != 1 else ''}, about +6% per year around a 3-year midpoint"),
    ]

    assumptions = [
        "Illustrative baselines for planning, not live market data. Check real postings and salary surveys before you negotiate.",
        f"Currency conversion assumes 1 USD = {USD_TO.get(currency, 1.0):.2f} {currency}." if currency != "USD" else "Figures are in US dollars.",
        "Role family was matched from your job title." if matched else "Your job title was not recognised, so a general-role baseline was used.",
    ]

    return SalaryEstimate(
        currency=currency,
        low=low,
        mid=mid,
        high=high,
        recommended_ask=recommended,
        walk_away=walk_away,
        market=market["label"],
        role_family=family.label,
        seniority_label=seniority_label,
        target_position=target_position,
        target_comment=target_comment,
        offer_position=offer_position,
        offer_comment=offer_comment,
        breakdown=breakdown,
        assumptions=assumptions,
    )
