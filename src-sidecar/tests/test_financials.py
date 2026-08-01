from fastapi.testclient import TestClient
from app.main import app
from app.database import settings_store

client = TestClient(app)

def test_get_financials_seeded_company():
    """Test GET /api/financials/VOLV-B returns reports and Pandas TTM metrics."""
    response = client.get("/api/financials/VOLV-B")
    assert response.status_code == 200
    data = response.json()

    assert "company" in data
    assert data["company"]["ticker"] == "VOLV-B"
    assert "reports" in data
    assert len(data["reports"]) > 0

    assert "ttm" in data
    ttm = data["ttm"]
    assert ttm["ticker"] == "VOLV-B"
    assert ttm["revenue_ttm"] is not None
    assert ttm["operating_margin_pct"] is not None

def test_get_financials_demo_mode_restriction():
    """Test GET /api/financials for unseeded ticker in Demo Mode returns 404 DEMO_MODE_RESTRICTION."""
    settings_store.delete_api_key()
    response = client.get("/api/financials/ERIC-B")
    assert response.status_code == 404
    detail = response.json()["detail"]
    assert detail["code"] == "DEMO_MODE_RESTRICTION"
    assert detail["ticker"] == "ERIC-B"
