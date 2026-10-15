from conftest import USER_A, USER_B

RESUME = {
    "target_role": "Data Analyst",
    "key_skills": "Python, SQL, Excel, Tableau",
    "experience": "Built dashboards in Tableau that cut reporting time by 40% for a team of 12 analysts.",
    "years_experience": 2,
}
SALARY = {"current_offer": 85000, "target_salary": 95000, "location": "Melbourne", "currency": "AUD", "strategy": "data_driven"}


def test_health_is_public(client_for):
    res = client_for(USER_A).get("/api/health")
    assert res.status_code == 200 and res.json()["status"] == "ok"


def test_unauthenticated_requests_are_rejected():
    from fastapi.testclient import TestClient
    from app.main import app

    app.dependency_overrides.clear()
    res = TestClient(app).get("/api/career-plans")
    assert res.status_code == 401


def test_full_journey_saves_each_step_then_generates(client_for, db):
    c = client_for(USER_A)
    plan = c.post("/api/career-plans", json={"title": "Grad plan"}).json()
    assert plan["status"] == "draft" and plan["current_step"] == 1

    r1 = c.put(f"/api/career-plans/{plan['id']}/resume", json=RESUME)
    assert r1.status_code == 200 and r1.json()["current_step"] == 2
    assert db.tables["career_plans"][0]["resume_data"]["target_role"] == "Data Analyst"

    r2 = c.put(f"/api/career-plans/{plan['id']}/salary", json=SALARY)
    assert r2.status_code == 200 and r2.json()["current_step"] == 3

    done = c.post(f"/api/career-plans/{plan['id']}/generate").json()
    assert done["status"] == "complete"
    assert 0 <= done["readiness_score"] <= 100
    assert done["plan"]["method"] == "rule-based"
    assert done["plan"]["steps"] and done["plan"]["disclaimer"]
    assert len(done["plan"]["script"]["lines"]) == 6

    latest = c.get("/api/career-plans/latest").json()
    assert latest["id"] == plan["id"]


def test_salary_step_requires_resume_first(client_for):
    c = client_for(USER_A)
    plan = c.post("/api/career-plans", json={}).json()
    res = c.put(f"/api/career-plans/{plan['id']}/salary", json=SALARY)
    assert res.status_code == 409


def test_generate_requires_both_steps(client_for):
    c = client_for(USER_A)
    plan = c.post("/api/career-plans", json={}).json()
    res = c.post(f"/api/career-plans/{plan['id']}/generate")
    assert res.status_code == 409 and "résumé" in res.json()["detail"]


def test_editing_an_earlier_step_invalidates_the_generated_plan(client_for):
    c = client_for(USER_A)
    plan = c.post("/api/career-plans", json={}).json()
    c.put(f"/api/career-plans/{plan['id']}/resume", json=RESUME)
    c.put(f"/api/career-plans/{plan['id']}/salary", json=SALARY)
    c.post(f"/api/career-plans/{plan['id']}/generate")
    edited = c.put(f"/api/career-plans/{plan['id']}/resume", json={**RESUME, "years_experience": 5}).json()
    assert edited["plan"] is None and edited["status"] == "draft"


def test_users_cannot_read_or_change_each_others_plans(client_for):
    a = client_for(USER_A)
    plan = a.post("/api/career-plans", json={}).json()
    b = client_for(USER_B)
    assert b.get(f"/api/career-plans/{plan['id']}").status_code == 404
    assert b.put(f"/api/career-plans/{plan['id']}/resume", json=RESUME).status_code == 404
    assert b.delete(f"/api/career-plans/{plan['id']}").status_code == 404
    assert b.get("/api/career-plans").json() == []


def test_validation_returns_a_friendly_message(client_for):
    c = client_for(USER_A)
    plan = c.post("/api/career-plans", json={}).json()
    res = c.put(f"/api/career-plans/{plan['id']}/resume", json={**RESUME, "experience": "too short"})
    body = res.json()
    assert res.status_code == 422
    assert "experience" in body["fields"] and body["detail"]


def test_stateless_tools(client_for):
    c = client_for(USER_A)
    est = c.post("/api/salary/estimate", json={"role": "UX Designer", "location": "Sydney", "experience_years": 2, "currency": "AUD", "target_salary": 90000}).json()
    assert est["estimate"]["low"] < est["estimate"]["high"]
    assert len(est["script"]["lines"]) == 6
    ready = c.post("/api/resume/readiness", json={"target_role": "Data Analyst", "key_skills": "SQL"}).json()
    assert 0 <= ready["score"] <= 100


def test_applications_crud_and_isolation(client_for):
    a = client_for(USER_A)
    created = a.post("/api/applications", json={"company": "Atlassian", "role": "Data Analyst", "status": "applied"}).json()
    assert a.patch(f"/api/applications/{created['id']}", json={"status": "interviewing"}).json()["status"] == "interviewing"
    assert len(a.get("/api/applications").json()) == 1
    b = client_for(USER_B)
    assert b.patch(f"/api/applications/{created['id']}", json={"status": "offer"}).status_code == 404
    assert b.delete(f"/api/applications/{created['id']}").status_code == 404
    a = client_for(USER_A)  # overrides are per-app, so switch back to user A explicitly
    assert a.delete(f"/api/applications/{created['id']}").status_code == 204
    assert a.get("/api/applications").json() == []


def test_application_rejects_bad_link(client_for):
    res = client_for(USER_A).post("/api/applications", json={"company": "X", "role": "Y", "job_url": "javascript:alert(1)"})
    assert res.status_code == 422


def test_export_contains_only_the_users_rows(client_for):
    a = client_for(USER_A)
    a.post("/api/career-plans", json={"title": "A plan"})
    b = client_for(USER_B)
    b.post("/api/career-plans", json={"title": "B plan"})
    exported = client_for(USER_A).get("/api/me/export")
    assert exported.status_code == 200
    data = exported.json()
    assert [p["title"] for p in data["career_plans"]] == ["A plan"]
    assert "attachment" in exported.headers["content-disposition"]


def test_account_deletion_requires_the_exact_confirmation(client_for):
    c = client_for(USER_A)
    assert c.request("DELETE", "/api/me", json={"confirm": "yes"}).status_code == 422
