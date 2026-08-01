import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("normalizer")


def _pick(obj: Dict[str, Any], *keys: str) -> Any:
    """Return the first non-None value among the given candidate keys."""
    for key in keys:
        if key in obj and obj[key] is not None:
            return obj[key]
    return None


def _to_period(period_raw: Any, period_type: str, report_type: str) -> str:
    """
    Builds a human-readable period identifier from raw BörsAPI period data
    (e.g. '2024', '2024-Q3'). Falls back gracefully for unknown shapes.
    """
    if period_raw is None:
        return "UNKNOWN"

    if isinstance(period_raw, dict):
        year = _pick(period_raw, "year", "report_year", "year_end")
        quarter = _pick(period_raw, "quarter", "q")
        if year and quarter:
            return f"{year}-Q{quarter}"
        if year:
            return str(year)
        return "UNKNOWN"

    if isinstance(period_raw, (int, float)):
        return str(int(period_raw))

    text = str(period_raw).strip()
    if not text:
        return "UNKNOWN"

    # Already shaped like '2024-Q3' or '2024Q3'
    if "-Q" in text.upper() or text.upper().startswith(("Q1", "Q2", "Q3", "Q4")):
        return text

    # ISO date -> derive period/year
    if text[:4].isdigit():
        return text[:4]

    return text


def _period_type_from(raw: Any, reporting_type: str) -> str:
    if reporting_type.strip().upper().startswith("Q"):
        return "QUARTER"
    if reporting_type.strip().upper() in ("FY", "YEAR", "Y", "ANNUAL", "A", "R12", "TTM"):
        return "FY"
    if isinstance(raw, dict):
        raw_type = (_pick(raw, "type", "period_type", "report_type") or "").upper()
        if raw_type.startswith("Q"):
            return "QUARTER"
        if raw_type in ("YEAR", "FY"):
            return "FY"
    return "FY"


def normalize_company(raw: Any, ticker: Optional[str] = None) -> Dict[str, Any]:
    """Maps a BörsAPI company object into the local `companies` table shape."""
    if not isinstance(raw, dict):
        raw = {}

    name = _pick(raw, "name", "company_name", "title")
    found_ticker = _pick(raw, "ticker", "symbol", "instrument", "code") or ticker
    if isinstance(found_ticker, dict):
        found_ticker = _pick(found_ticker, "ticker", "symbol", "code")
    found_ticker = str(found_ticker).upper().strip() if found_ticker else None

    company_id = _pick(raw, "id", "instrument_id", "uuid", "company_id")
    if company_id is None:
        company_id = found_ticker
    company_id = str(company_id) if company_id is not None else None

    sector = _pick(raw, "sector", "sector_name", "industry", "branch")
    if isinstance(sector, dict):
        sector = _pick(sector, "name", "sector_name", "title")

    return {
        "id": company_id,
        "ticker": found_ticker,
        "isin": _pick(raw, "isin"),
        "name": name or found_ticker or "Unnamed",
        "sector": str(sector) if sector else None,
        "market": _pick(raw, "market", "exchange", "market_name") or "XSTO",
        "is_seed_data": 0,
    }


def normalize_report(raw: Any, company_ticker: str, index: int = 0) -> Optional[Dict[str, Any]]:
    """Maps a single BörsAPI report record into the local `financial_reports` table shape."""
    if not isinstance(raw, dict):
        return None

    period_type = _period_type_from(raw, str(_pick(raw, "report_type", "type") or ""))
    period = _to_period(_pick(raw, "period", "report_end", "report_period"), period_type, "")

    def num(*keys: str):
        return _pick(raw, *keys)

    report_id = _pick(raw, "id", "report_id", "reportId")
    if report_id is None:
        report_id = f"{company_ticker}-{period}-{index}"
    report_id = str(report_id)

    return {
        "id": report_id,
        "company_ticker": company_ticker,
        "period": period,
        "period_type": period_type,
        "report_type": str(_pick(raw, "report_type", "reporting_type") or "CONSOLIDATED").upper(),
        "revenue": num("revenue", "net_sales", "netSales", "omsattning", "total_revenue"),
        "operating_income": num("operating_income", "operatingIncome", "operating_profit", "ebit", "rorelseresultat"),
        "pre_tax_income": num("pre_tax_income", "preTaxIncome", "pretax_income", "income_before_tax", "profit_before_tax"),
        "net_income": num("net_income", "netIncome", "net_profit", "net_result", "resultat", "net_result_before_minority"),
        "gross_profit": num("gross_profit", "grossProfit", "gross_income"),
        "eps": num("eps", "earnings_per_share", "eps_ttm"),
        "total_assets": num("total_assets", "totalAssets", "assets_total"),
        "total_equity": num("total_equity", "totalEquity", "equity", "equity_total", "eget_kapital"),
        "net_debt": num("net_debt", "netDebt", "net_financial_debt"),
        "operating_cash_flow": num("operating_cash_flow", "operatingCashFlow", "cash_flow_operating", "ocf"),
        "capex": num("capex", "capital_expenditure", "cap_ex"),
        "free_cash_flow": num("free_cash_flow", "freeCashFlow", "fcf"),
    }
