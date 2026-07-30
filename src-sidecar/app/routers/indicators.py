from fastapi import APIRouter, HTTPException
from app.services.indicator_engine import FinancialIndicatorEngine

router = APIRouter(prefix="/indicators", tags=["Indicators & Multiples"])

@router.get("/{ticker}")
def get_valuation_multiples(ticker: str):
    """Get calculated valuation multiples (P/E TTM, margins, net debt) combining stock price and fundamental data."""
    clean_ticker = ticker.upper()
    multiples = FinancialIndicatorEngine.calculate_valuation_multiples(clean_ticker)

    if not multiples:
        raise HTTPException(
            status_code=404,
            detail=f"Could not calculate indicators for {clean_ticker}. Data missing."
        )

    return multiples
