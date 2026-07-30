from fastapi import APIRouter, HTTPException
from app.database.connection import get_db_connection
from app.services.indicator_engine import FinancialIndicatorEngine

router = APIRouter(prefix="/financials", tags=["Financials"])

@router.get("/{ticker}")
def get_financial_reports(ticker: str):
    """Get financial reports and TTM metrics for a company."""
    clean_ticker = ticker.upper()
    conn = get_db_connection()

    # Check if company exists in SQLite
    company = conn.execute("SELECT * FROM companies WHERE ticker = ?", (clean_ticker,)).fetchone()
    if not company:
        conn.close()
        raise HTTPException(
            status_code=404,
            detail={
                "code": "DEMO_MODE_RESTRICTION",
                "message": f"Bolaget '{clean_ticker}' finns inte i den lokala frödatabasen. Mata in din BörsAPI-nyckel för att hämta live-data.",
                "ticker": clean_ticker,
            }
        )

    # Fetch raw reports
    reports = conn.execute(
        "SELECT * FROM financial_reports WHERE company_ticker = ? ORDER BY period DESC",
        (clean_ticker,)
    ).fetchall()
    conn.close()

    # Calculate Pandas TTM
    ttm_metrics = FinancialIndicatorEngine.calculate_ttm_metrics(clean_ticker)

    return {
        "company": dict(company),
        "reports": [dict(r) for r in reports],
        "ttm": ttm_metrics,
    }
