"""Negotiation script generator: six lines, four styles, fully deterministic.

The script is assembled from the user's own numbers and the chosen style. It
never invents facts about the user's achievements; it leaves a clearly marked
`[ ]` slot for evidence only they can supply.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass

from .salary import SYMBOL, SalaryEstimate

STYLES = {
    "collaborative": "Collaborative: win-win and relationship-first",
    "data_driven": "Data-driven: market evidence and benchmarks",
    "assertive": "Assertive: anchor high and hold firm",
    "flexible": "Flexible: open to non-salary value",
}


@dataclass
class Script:
    style: str
    style_label: str
    lines: list[str]
    tips: list[str]
    if_they_say_no: list[str]

    def to_dict(self) -> dict:
        return asdict(self)


def _money(currency: str, amount: float) -> str:
    return f"{SYMBOL.get(currency, '')}{int(amount):,}"


def build_script(
    *, role: str, style: str, estimate: SalaryEstimate, current_offer: float | None
) -> Script:
    style = style if style in STYLES else "collaborative"
    cur = estimate.currency
    ask = _money(cur, estimate.recommended_ask)
    low = _money(cur, estimate.low)
    high = _money(cur, estimate.high)
    offer = _money(cur, current_offer) if current_offer else "the offer"
    evidence = "[add one specific result you delivered that is relevant to this role]"

    thanks = f"Thank you, I'm genuinely excited about the {role} role and about working with the team."

    if style == "data_driven":
        lines = [
            thanks,
            f"I've looked at comparable {estimate.role_family.lower()} roles in {estimate.market}, and the typical range I'm seeing is {low} to {high}.",
            f"Given that range, and {evidence}, I'd like to ask for {ask}.",
            f"Could you share how {offer} was benchmarked, so we can compare like for like?",
            "If there's a gap, what would you need to see from me to close it?",
            "I'm keen to find a number that works for both of us and get started.",
        ]
    elif style == "assertive":
        lines = [
            thanks,
            f"Based on the scope of the role and {evidence}, my expectation is {ask}.",
            f"I'm ready to accept at that number, and I'm comfortable going back and forth on how we get there.",
            f"{offer.capitalize()} is below where I need to be, so I'd like us to revisit the base salary first.",
            "Can you take this back to the hiring manager and come back to me by an agreed date?",
            "I'd like to say yes, and I think we're close.",
        ]
    elif style == "flexible":
        lines = [
            thanks,
            f"I'd like to look at the whole package. My target for base salary is {ask}, but I'm open to how we structure it.",
            "If base is constrained, I'd value a sign-on bonus, a six-month review with a pay rise, extra leave, or a development budget.",
            f"Given {evidence}, I believe the value I'll bring supports the higher end of the range.",
            "Which of these levers have the most room on your side?",
            "I'm confident we can land on something that works for both of us.",
        ]
    else:  # collaborative
        lines = [
            thanks,
            f"I'd love to make this work. Based on my experience and {evidence}, I was hoping for something closer to {ask}.",
            f"I understand there are constraints, so I'd like to hear how you arrived at {offer}.",
            "Is there flexibility on the base, or on other parts of the package, to bridge the difference?",
            "I'm happy to talk through my reasoning in more detail if that helps.",
            "I want to accept and get started, so let's find the middle ground.",
        ]

    tips = [
        "Negotiate once you have a written offer and before you say yes. Never give your number first if you can avoid it.",
        "Ask for the full package: base, bonus, leave, review date, training budget and start date.",
        "Pause after you state your number. Silence is part of the negotiation.",
        "Get the final agreement in writing before you accept.",
        f"Keep your walk-away number ({_money(cur, estimate.walk_away)}) to yourself.",
    ]
    if_no = [
        "Ask what would need to be true for the number to move, and by when.",
        "Ask for a documented six-month review with a defined pay-rise path.",
        "Ask for non-salary value: sign-on bonus, extra leave, remote days, training budget.",
    ]
    return Script(style=style, style_label=STYLES[style], lines=lines, tips=tips, if_they_say_no=if_no)
