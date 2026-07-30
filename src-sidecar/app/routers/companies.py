from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.database.connection import get_db_connection

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.get("")
def list_companies(search: Optional[str] = Query(None, description="Search ticker or name")):
    """List cached companies in SQLite."""
    conn = get_db_connection()
    if search:
        query = "%" + search.strip() + "%"
        rows = conn.execute(
            "SELECT * FROM companies WHERE ticker LIKE ? OR name LIKE ? ORDER BY is_seed_data DESC, ticker ASC",
            (query, query)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM companies ORDER BY is_seed_data DESC, ticker ASC").fetchall()
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
