from app.engines.readiness import assess_readiness
from app.engines.roles import find_role, parse_skills
from app.engines.salary import estimate_salary, experience_multiplier
from app.engines.script import build_script

STRONG_EXPERIENCE = (
    "Built a reporting pipeline in Python and SQL that cut weekly reporting time by 60%. "
    "Led a team of 4 analysts to ship 3 Tableau dashboards used by 120 staff. "
    "Reduced data errors from 8% to 1% by automating validation. "
    "Presented insights to executives that saved $250k in annual spend. "
    "Designed an A/B testing framework adopted by 5 product teams across the company."
)


def test_role_matching_and_fallback():
    family, matched = find_role("Senior Data Analyst")
    assert matched and family.id == "data-analyst"
    family, matched = find_role("Wizard of Whimsy")
    assert not matched and family.id == "generalist"


def test_parse_skills_dedupes_and_splits():
    assert parse_skills("Python, python; SQL\n- Tableau") == ["Python", "SQL", "Tableau"]


def test_readiness_is_deterministic_and_bounded():
    a = assess_readiness(target_role="Data Analyst", key_skills="Python, SQL, Excel, Tableau, Power BI, Statistics", experience=STRONG_EXPERIENCE)
    b = assess_readiness(target_role="Data Analyst", key_skills="Python, SQL, Excel, Tableau, Power BI, Statistics", experience=STRONG_EXPERIENCE)
    assert a.score == b.score and 0 <= a.score <= 100
    assert a.score >= 75


def test_readiness_every_point_traces_to_a_named_check():
    r = assess_readiness(target_role="Data Analyst", key_skills="Python", experience="I did data stuff at a company.")
    assert r.score < 50
    assessed = [c for c in r.checks if c.assessed]
    assert all(c.id and c.label and 0 <= c.points <= c.max_points for c in r.checks)
    # Weak inputs must come with an actionable tip, never silence.
    assert all(c.tip for c in assessed if not c.passed)


def test_job_description_check_only_counts_when_provided():
    base = dict(target_role="Data Analyst", key_skills="Python, SQL", experience=STRONG_EXPERIENCE)
    without = assess_readiness(**base)
    jd = next(c for c in without.checks if c.id == "jd_alignment")
    assert jd.assessed is False
    with_jd = assess_readiness(**base, job_description="We need Tableau, dbt and Snowflake. Tableau dashboards and dbt models daily.")
    jd = next(c for c in with_jd.checks if c.id == "jd_alignment")
    assert jd.assessed is True
    assert with_jd.jd_keywords_missing


def test_four_digit_years_are_not_counted_as_results():
    r = assess_readiness(target_role="Data Analyst", key_skills="Python", experience="Worked 2019 to 2021 at a firm doing reports.")
    impact = next(c for c in r.checks if c.id == "quantified_impact")
    assert impact.points == 0


def test_salary_ordering_and_breakdown():
    e = estimate_salary(role="Data Analyst", location="Melbourne, Australia", experience_years=3, currency="AUD", current_offer=80000, target_salary=95000)
    assert e.low < e.mid < e.high
    assert e.recommended_ask >= 80000 * 1.10 - 1000
    assert e.market == "Australia" and e.currency == "AUD"
    assert len(e.breakdown) == 5 and e.assumptions


def test_salary_experience_multiplier_is_capped():
    assert experience_multiplier(3) == 1.0
    assert experience_multiplier(40) == experience_multiplier(15)
    assert experience_multiplier(0) < 1.0


def test_target_position_flags():
    base = dict(role="Software Engineer", location="Sydney", experience_years=3, currency="AUD")
    mid = estimate_salary(**base, target_salary=1).mid
    assert estimate_salary(**base, target_salary=mid * 2).target_position == "above"
    assert estimate_salary(**base, target_salary=mid).target_position == "within"
    assert estimate_salary(**base, target_salary=mid * 0.4).target_position == "below"


def test_script_has_six_lines_in_every_style_and_names_a_slot_for_evidence():
    e = estimate_salary(role="Product Manager", location="Melbourne", experience_years=4, currency="AUD", current_offer=100000)
    for style in ("collaborative", "data_driven", "assertive", "flexible"):
        s = build_script(role="Product Manager", style=style, estimate=e, current_offer=100000)
        assert len(s.lines) == 6
        assert s.style == style
    # Never invents achievements: leaves a visible placeholder for the user's evidence.
    assert any("[add one specific result" in line for line in s.lines)
