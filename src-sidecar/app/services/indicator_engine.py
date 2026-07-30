import logging
from typing import Dict, Any, Optional, List
import pandas as pd
from app.database.connection import get_db_connection

logger = logging.getLogger("indicator_engine")

class FinancialIndicatorEngine:
    """
    Engine powered by Pandas for financial analytics, technical indicators, and valuation multiples.
    Reads cached data directly from the local SQLite database.
    """

    @staticmethod
    def get_price_series_with_indicators(ticker: str) -> List[Dict[str, Any]]:
        """
        Fetches price series for a ticker and calculates technical moving averages (SMA50, SMA200).
        """
        conn = get_db_connection()
        query = "SELECT date, open, high, low, close, volume FROM price_series WHERE company_ticker = ? ORDER BY date ASC"
        df = pd.read_sql_query(query, conn, params=(ticker,))
        conn.close()

        if df.empty:
            return []

        # Convert to numeric
        df["close"] = pd.to_numeric(df["close"])

        # Calculate Technical Indicators
        df["sma50"] = df["close"].rolling(window=50, min_periods=1).mean().round(2)
        df["sma200"] = df["close"].rolling(window=200, min_periods=1).mean().round(2)

        # Replace NaN values with None for JSON serialization
        df = df.where(pd.notnull(df), None)
        return df.to_dict(orient="records")

    @staticmethod
    def calculate_ttm_metrics(ticker: str) -> Dict[str, Any]:
        """
        Calculates Trailing Twelve Months (TTM) financial metrics by summing the last 4 quarters.
        Falls back to the most recent annual (FY) report if quarterly data is incomplete.
        """
        conn = get_db_connection()
        query = """
            SELECT period, period_type, revenue, operating_income, net_income, gross_profit, eps,
                   total_assets, total_equity, net_debt, operating_cash_flow, capex, free_cash_flow
            FROM financial_reports
            WHERE company_ticker = ?
            ORDER BY period DESC
        """
        df = pd.read_sql_query(query, conn, params=(ticker,))
        conn.close()

        if df.empty:
            return {}

        quarters_df = df[df["period_type"] == "QUARTER"].head(4)

        if len(quarters_df) == 4:
            # Sum flow items over 4 quarters
            ttm_revenue = quarters_df["revenue"].sum()
            ttm_operating_income = quarters_df["operating_income"].sum()
            ttm_net_income = quarters_df["net_income"].sum()
            ttm_gross_profit = quarters_df["gross_profit"].sum()
            ttm_eps = quarters_df["eps"].sum()
            ttm_free_cash_flow = quarters_df["free_cash_flow"].sum()
            source = "4 Quarters Sum"
            latest_balance = quarters_df.iloc[0]
        else:
            # Fallback to latest FY report
            fy_df = df[df["period_type"] == "FY"]
            if fy_df.empty:
                latest = df.iloc[0]
            else:
                latest = fy_df.iloc[0]

            ttm_revenue = latest["revenue"]
            ttm_operating_income = latest["operating_income"]
            ttm_net_income = latest["net_income"]
            ttm_gross_profit = latest["gross_profit"]
            ttm_eps = latest["eps"]
            ttm_free_cash_flow = latest["free_cash_flow"]
            source = f"Annual Report ({latest['period']})"
            latest_balance = latest

        operating_margin = round((ttm_operating_income / ttm_revenue * 100), 2) if ttm_revenue else None
        net_margin = round((ttm_net_income / ttm_revenue * 100), 2) if ttm_revenue else None

        return {
            "ticker": ticker,
            "ttm_source": source,
            "revenue_ttm": float(ttm_revenue) if ttm_revenue else None,
            "operating_income_ttm": float(ttm_operating_income) if ttm_operating_income else None,
            "net_income_ttm": float(ttm_net_income) if ttm_net_income else None,
            "gross_profit_ttm": float(ttm_gross_profit) if ttm_gross_profit else None,
            "eps_ttm": round(float(ttm_eps), 2) if ttm_eps else None,
            "free_cash_flow_ttm": float(ttm_free_cash_flow) if ttm_free_cash_flow else None,
            "operating_margin_pct": operating_margin,
            "net_margin_pct": net_margin,
            "total_assets": float(latest_balance["total_assets"]) if pd.notnull(latest_balance["total_assets"]) else None,
            "total_equity": float(latest_balance["total_equity"]) if pd.notnull(latest_balance["total_equity"]) else None,
            "net_debt": float(latest_balance["net_debt"]) if pd.notnull(latest_balance["net_debt"]) else None,
        }

    @classmethod
    def calculate_valuation_multiples(cls, ticker: str) -> Dict[str, Any]:
        """
        Combines latest closing price with TTM metrics to calculate P/E, P/S, EV/EBIT.
        """
        ttm = cls.calculate_ttm_metrics(ticker)
        if not ttm:
            return {}

        conn = get_db_connection()
        price_row = conn.execute(
            "SELECT close, date FROM price_series WHERE company_ticker = ? ORDER BY date DESC LIMIT 1",
            (ticker,)
        ).fetchone()
        conn.close()

        latest_price = float(price_row["close"]) if price_row else None
        price_date = price_row["date"] if price_row else None

        pe_ratio = None
        ps_ratio = None

        if latest_price and ttm.get("eps_ttm") and ttm["eps_ttm"] > 0:
            pe_ratio = round(latest_price / ttm["eps_ttm"], 2)

        return {
            "ticker": ticker,
            "latest_price": latest_price,
            "price_date": price_date,
            "pe_ttm": pe_ratio,
            "operating_margin_pct": ttm.get("operating_margin_pct"),
            "net_margin_pct": ttm.get("net_margin_pct"),
            "revenue_ttm": ttm.get("revenue_ttm"),
            "net_income_ttm": ttm.get("net_income_ttm"),
            "eps_ttm": ttm.get("eps_ttm"),
            "free_cash_flow_ttm": ttm.get("free_cash_flow_ttm"),
            "net_debt": ttm.get("net_debt"),
        }
