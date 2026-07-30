from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import health, companies, financials, price, indicators
from app.database.seed_data import seed_database

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION
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
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(companies.router, prefix=settings.API_PREFIX)
app.include_router(financials.router, prefix=settings.API_PREFIX)
app.include_router(price.router, prefix=settings.API_PREFIX)
app.include_router(indicators.router, prefix=settings.API_PREFIX)

if __name__ == "__main__":
    import uvicorn
    import sys
    port = 8000
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    uvicorn.run("app.main:app", host="127.0.0.1", port=port, reload=True)
