import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.database.connection import get_db_connection
from app.database.settings_store import get_api_key
from app.services.borsapi_client import BorsApiClient
from app.services import normalizer

logger = logging.getLogger("companies_router")

router = APIRouter(prefix="/companies", tags=["Companies"])


def _persist_companies(companies: List[dict]) -> None:
    """Upserts a list of normalized company profiles into SQLite."""
    conn = get_db_connection()
    try:
        with conn:
            for comp in companies:
                conn.execute(
                    """
                    INSERT INTO companies (id, ticker, isin, name, sector, market, is_seed_data)
                    VALUES (:id, :ticker, :isin, :name, :sector, :market, :is_seed_data)
                    ON CONFLICT(ticker) DO UPDATE SET
                        name=excluded.name,
                        sector=excluded.sector,
                        isin=excluded.isin,
                        market=excluded.market,
                        is_seed_data=0;
                    """,
                    comp,
                )
    finally:
        conn.close()


@router.get("")
async def list_companies(search: Optional[str] = Query(None, description="Search ticker or name")):
    """List companies. If a BörsAPI key is present, fetches and caches live matches from BörsAPI cloud."""
    api_key = get_api_key()

    if api_key:
        try:
            raw_companies = await BorsApiClient(api_key=api_key).get_companies(search=search.strip() if search else None, limit=100)
            normalized = [
                c for c in (normalizer.normalize_company(comp) for comp in raw_companies)
                if c and c.get("ticker")
            ]
            if normalized:
                _persist_companies(normalized)
        except Exception as e:  # noqa: BLE001
            logger.error(f"BörsAPI live company fetch failed: {e}")

    conn = get_db_connection()
    if search:
        query = "%" + search.strip() + "%"
        rows = conn.execute(
            "SELECT * FROM companies WHERE ticker LIKE ? OR name LIKE ? ORDER BY ticker ASC",
            (query, query),
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM companies ORDER BY ticker ASC").fetchall()
    conn.close()

    return [dict(row) for row in rows]


@router.get("/{ticker}")
def get_company(ticker: str):
    """Get single company profile by ticker."""
    conn = get_db_connection()
    row = conn.execute("SELECT * FROM companies WHERE ticker = ?", (ticker.upper(),)).fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Company with ticker {ticker} not found in local cache.")

    return dict(row)
