import logging
from typing import List, Dict, Any, Optional
import pandas as pd
import yfinance as yf

logger = logging.getLogger("price_client")

def normalize_yahoo_ticker(ticker: str) -> str:
    """
    Normalizes Swedish tickers to Yahoo Finance symbol format.
    e.g., 'VOLV-B' -> 'VOLV-B.ST', 'INVE-B' -> 'INVE-B.ST'
    """
    clean_ticker = ticker.upper().strip()
    if not clean_ticker.endswith(".ST") and not "." in clean_ticker:
        return f"{clean_ticker}.ST"
    return clean_ticker

class PriceClient:
    """
    Client for fetching historical market price data using yfinance.
    """

    @staticmethod
    def get_historical_prices(ticker: str, period: str = "3y", interval: str = "1d") -> List[Dict[str, Any]]:
        """
        Fetches historical OHLCV data from Yahoo Finance.
        Returns a list of dicts formatted for TradingView Lightweight Charts and SQLite.
        """
        yf_symbol = normalize_yahoo_ticker(ticker)
        logger.info(f"Fetching historical price data for {yf_symbol} (period={period})...")

        try:
            stock = yf.Ticker(yf_symbol)
            df: pd.DataFrame = stock.history(period=period, interval=interval)

            if df.empty:
                logger.warning(f"No price data found for {yf_symbol}")
                return []

            df = df.reset_index()
            price_records = []

            for _, row in df.iterrows():
                # Format Date as YYYY-MM-DD
                date_str = pd.to_datetime(row["Date"]).strftime("%Y-%m-%d")
                price_records.append({
                    "date": date_str,
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                    "volume": int(row["Volume"]),
                })

            return price_records
        except Exception as e:
            logger.error(f"Error downloading price data for {ticker}: {e}")
            return []
