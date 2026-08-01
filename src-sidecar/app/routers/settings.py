from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.database import settings_store
from app.services.borsapi_client import BorsApiClient

router = APIRouter(prefix="/settings", tags=["Settings"])

class ApiKeyPayload(BaseModel):
    api_key: str

@router.get("/api-key")
def get_api_key_status():
    """Returns whether a BörsAPI key is configured (never the raw value)."""
    has_key = bool(settings_store.get_api_key())
    return {"has_key": has_key}

@router.put("/api-key")
async def save_api_key(payload: ApiKeyPayload):
    """Validates and persists a BörsAPI key."""
    api_key = payload.api_key.strip()
    if not api_key:
        raise HTTPException(status_code=422, detail="API-nyckeln får inte vara tom.")

    client = BorsApiClient(api_key=api_key)
    valid = await client.validate_api_key()
    if not valid:
        raise HTTPException(
            status_code=422,
            detail="Ogiltig BörsAPI-nyckel. Kontrollera nyckeln och försök igen.",
        )

    settings_store.set_api_key(api_key)
    return {"status": "ok", "label": "live", "has_key": True}

@router.delete("/api-key")
def delete_api_key():
    """Removes the configured BörsAPI key."""
    settings_store.delete_api_key()
    return {"status": "ok", "label": "demo", "has_key": False}
