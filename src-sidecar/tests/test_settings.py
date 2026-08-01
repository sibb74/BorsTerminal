import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.database import settings_store

client = TestClient(app)

@pytest.fixture(autouse=True)
def cleanup_settings():
    """Ensure API key is cleared before and after each test."""
    settings_store.delete_api_key()
    yield
    settings_store.delete_api_key()

def test_get_api_key_status_default():
    """Test that default API key status returns has_key = False."""
    response = client.get("/api/settings/api-key")
    assert response.status_code == 200
    assert response.json() == {"has_key": False}

def test_save_api_key_empty():
    """Test saving an empty or whitespace API key returns HTTP 422 error."""
    response = client.put("/api/settings/api-key", json={"api_key": "   "})
    assert response.status_code == 422
    assert response.json()["detail"] == "API-nyckeln får inte vara tom."

@patch("app.routers.settings.BorsApiClient")
def test_save_api_key_invalid(mock_client_class):
    """Test saving an invalid API key returns HTTP 422 with rejected reason."""
    mock_instance = AsyncMock()
    mock_instance.validate_api_key_with_reason.return_value = (
        False,
        "Ogiltig BörsAPI-nyckel. Kontrollera nyckeln och försök igen.",
    )
    mock_client_class.return_value = mock_instance

    response = client.put("/api/settings/api-key", json={"api_key": "fd_invalid_xyz"})
    assert response.status_code == 422
    assert "Ogiltig BörsAPI-nyckel" in response.json()["detail"]
    assert settings_store.get_api_key() is None

@patch("app.routers.settings.BorsApiClient")
def test_save_api_key_valid(mock_client_class):
    """Test saving a valid API key persists key and returns has_key = True."""
    mock_instance = AsyncMock()
    mock_instance.validate_api_key_with_reason.return_value = (True, "")
    mock_client_class.return_value = mock_instance

    response = client.put("/api/settings/api-key", json={"api_key": "fd_test_valid_key_123"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["has_key"] is True
    assert settings_store.get_api_key() == "fd_test_valid_key_123"

def test_delete_api_key():
    """Test deleting API key removes it from settings_store."""
    settings_store.set_api_key("fd_temp_key")
    assert settings_store.get_api_key() == "fd_temp_key"

    response = client.delete("/api/settings/api-key")
    assert response.status_code == 200
    assert response.json()["has_key"] is False
    assert settings_store.get_api_key() is None
