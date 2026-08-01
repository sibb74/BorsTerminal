import sys
import os
from pathlib import Path

# Add src-sidecar directory to sys.path so 'app' imports work in PyInstaller single-file mode
base_dir = Path(__file__).resolve().parent.parent
if str(base_dir) not in sys.path:
    sys.path.insert(0, str(base_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings as config
from app.routers import health, companies, financials, price, indicators, settings as settings_router
from app.database.seed_data import seed_database

app = FastAPI(
    title=config.PROJECT_NAME,
    version=config.VERSION
)

# Enable CORS for Tauri frontend local requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize SQLite tables and populate seed data on startup
@app.on_event("startup")
def startup_event():
    seed_database()

# Include Routers
app.include_router(health.router, prefix=config.API_PREFIX)
app.include_router(companies.router, prefix=config.API_PREFIX)
app.include_router(financials.router, prefix=config.API_PREFIX)
app.include_router(price.router, prefix=config.API_PREFIX)
app.include_router(indicators.router, prefix=config.API_PREFIX)
app.include_router(settings_router.router, prefix=config.API_PREFIX)

if __name__ == "__main__":
    import uvicorn
    port = 8000
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    uvicorn.run(app, host="127.0.0.1", port=port)
