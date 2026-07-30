import os
from pathlib import Path

class Settings:
    PROJECT_NAME: str = "BörsTerminal Sidecar"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # Path settings
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    DB_PATH: Path = DATA_DIR / "terminal_cache.db"
    
    # BörsAPI Cloud settings
    BORSAPI_BASE_URL: str = os.getenv("BORSAPI_BASE_URL", "https://borsapi.se/api/v1")
    
settings = Settings()
