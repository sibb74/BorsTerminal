from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_list_seeded_companies():
    """Test GET /api/companies returns 5 benchmark Swedish stocks."""
    response = client.get("/api/companies")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 5

    tickers = [c["ticker"] for c in data]
    assert "VOLV-B" in tickers
    assert "INVE-B" in tickers
    assert "HM-B" in tickers

def test_search_companies_filter():
    """Test GET /api/companies?search=VOLV filters results to Volvo."""
    response = client.get("/api/companies?search=VOLV")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["ticker"] == "VOLV-B"
    assert "Volvo" in data[0]["name"]
