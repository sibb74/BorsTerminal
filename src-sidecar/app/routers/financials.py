import logging
from fastapi import APIRouter, HTTPException
from app.database.connection import get_db_connection
from app.database.settings_store import get_api_key
from app.services.indicator_engine import FinancialIndicatorEngine
from app.services.borsapi_client import BorsApiClient
from app.services import normalizer

logger = logging.getLogger("financials_router")

router = APIRouter(prefix="/financials", tags=["Financials"])


def _persist_live_company(company: dict) -> str:
    """Inserts a company profile into SQLite and returns its ticker."""
    conn = get_db_connection()
    try:
        with conn:
            conn.execute(
                """
                INSERT INTO companies (id, ticker, isin, name, sector, market, is_seed_data)
                VALUES (:id, :ticker, :isin, :name, :sector, :market, :is_seed_data)
                ON CONFLICT(ticker) DO UPDATE SET
                    name=excluded.name,
                    sector=excluded.sector,
                    isin=excluded.isin,
                    market=excluded.market,
                    is_seed_data=excluded.is_seed_data;
                """,
                company,
            )
        return company["ticker"]
    finally:
        conn.close()


def _persist_live_reports(company_ticker: str, reports: list) -> None:
    """Inserts normalized BörsAPI reports into SQLite."""
    conn = get_db_connection()
    try:
        with conn:
            for idx, raw in enumerate(reports):
                record = normalizer.normalize_report(raw, company_ticker, index=idx)
                if not record:
                    continue
                conn.execute(
                    """
                    INSERT INTO financial_reports (
                        id, company_ticker, period, period_type, report_type,
                        revenue, operating_income, pre_tax_income, net_income, gross_profit, eps,
                        total_assets, total_equity, net_debt, operating_cash_flow, capex, free_cash_flow
                    ) VALUES (
                        :id, :company_ticker, :period, :period_type, :report_type,
                        :revenue, :operating_income, :pre_tax_income, :net_income, :gross_profit, :eps,
                        :total_assets, :total_equity, :net_debt, :operating_cash_flow, :capex, :free_cash_flow
                    )
                    ON CONFLICT(id) DO UPDATE SET
                        period=excluded.period,
                        period_type=excluded.period_type,
                        revenue=excluded.revenue,
                        operating_income=excluded.operating_income,
                        pre_tax_income=excluded.pre_tax_income,
                        net_income=excluded.net_income,
                        gross_profit=excluded.gross_profit,
                        eps=excluded.eps,
                        total_assets=excluded.total_assets,
                        total_equity=excluded.total_equity,
                        net_debt=excluded.net_debt,
                        operating_cash_flow=excluded.operating_cash_flow,
                        capex=excluded.capex,
                        free_cash_flow=excluded.free_cash_flow;
                    """,
                    record,
                )
    finally:
        conn.close()


@router.get("/{ticker}")
async def get_financial_reports(ticker: str):
    """Get financial reports and TTM metrics for a company."""
    clean_ticker = ticker.upper()
    conn = get_db_connection()

    # Check if company exists in SQLite
    company = conn.execute("SELECT * FROM companies WHERE ticker = ?", (clean_ticker,)).fetchone()
    conn.close()

    if not company:
        api_key = get_api_key()
        if not api_key:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "DEMO_MODE_RESTRICTION",
                    "message": f"Bolaget '{clean_ticker}' finns inte i den lokala frödatabasen. Mata in din BörsAPI-nyckel för att hämta live-data.",
                    "ticker": clean_ticker,
                },
            )

        # Attempt to fetch live reports via BörsAPI using the stored key
        client = BorsApiClient(api_key=api_key)
        try:
            raw_reports = await client.get_financial_reports(clean_ticker)
        except Exception as e:  # noqa: BLE001
            logger.error(f"BörsAPI live fetch failed for {clean_ticker}: {e}")
            raw_reports = []

        if not raw_reports:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "DEMO_MODE_RESTRICTION",
                    "message": f"Kunde inte hämta live-data för '{clean_ticker}' från BörsAPI.",
                    "ticker": clean_ticker,
                },
            )

        # Persist company profile + normalized reports, then re-read from DB
        live_company = normalizer.normalize_company({}, ticker=clean_ticker)
        _persist_live_company(live_company)
        _persist_live_reports(clean_ticker, raw_reports)

        conn = get_db_connection()
        company = conn.execute("SELECT * FROM companies WHERE ticker = ?", (clean_ticker,)).fetchone()
        conn.close()

    # Fetch raw reports
    conn = get_db_connection()
    reports = conn.execute(
        "SELECT * FROM financial_reports WHERE company_ticker = ? ORDER BY period DESC",
        (clean_ticker,),
    ).fetchall()
    conn.close()

    # Calculate Pandas TTM
    ttm_metrics = FinancialIndicatorEngine.calculate_ttm_metrics(clean_ticker)

    return {
        "company": dict(company),
        "reports": [dict(r) for r in reports],
        "ttm": ttm_metrics,
    }
