from fastapi import APIRouter, HTTPException
from app.services.indicator_engine import FinancialIndicatorEngine
from app.services.price_client import PriceClient
from app.database.connection import get_db_connection

router = APIRouter(prefix="/price", tags=["Price & Technicals"])

@router.get("/{ticker}")
def get_price_history(ticker: str):
    """
    Get daily OHLCV price series + technical moving averages (SMA50, SMA200) for TradingView charts.
    If no cached price data exists, automatically attempts to fetch via yfinance.
    """
    clean_ticker = ticker.upper()
    series = FinancialIndicatorEngine.get_price_series_with_indicators(clean_ticker)

    # If empty in local SQLite cache, attempt on-demand fetch via yfinance
    if not series:
        prices = PriceClient.get_historical_prices(clean_ticker, period="3y")
        if prices:
            conn = get_db_connection()
            with conn:
                for p in prices:
                    p["company_ticker"] = clean_ticker
                    conn.execute(
                        """
                        INSERT INTO price_series (company_ticker, date, open, high, low, close, volume)
                        VALUES (:company_ticker, :date, :open, :high, :low, :close, :volume)
                        ON CONFLICT(company_ticker, date) DO UPDATE SET
                            open=excluded.open, high=excluded.high, low=excluded.low, close=excluded.close, volume=excluded.volume;
                        """,
                        p,
                    )
            conn.close()
            series = FinancialIndicatorEngine.get_price_series_with_indicators(clean_ticker)

    if not series:
        raise HTTPException(status_code=404, detail=f"No price history found for ticker {clean_ticker}")

    return {
        "ticker": clean_ticker,
        "count": len(series),
        "candles": series,
    }
