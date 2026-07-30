import logging
import sqlite3
from app.database.connection import get_db_connection
from app.database.schema import init_db
from app.services.price_client import PriceClient

logger = logging.getLogger("seed_data")

SEED_COMPANIES = [
    {
        "id": "VOLV-B",
        "ticker": "VOLV-B",
        "isin": "SE0000115446",
        "name": "Volvo AB B",
        "sector": "Industri",
        "market": "XSTO",
        "is_seed_data": 1,
    },
    {
        "id": "INVE-B",
        "ticker": "INVE-B",
        "isin": "SE0000107419",
        "name": "Investor B",
        "sector": "Finans & Investment",
        "market": "XSTO",
        "is_seed_data": 1,
    },
    {
        "id": "HM-B",
        "ticker": "HM-B",
        "isin": "SE0000106270",
        "name": "Hennes & Mauritz B",
        "sector": "Sällanköpsvaror",
        "market": "XSTO",
        "is_seed_data": 1,
    },
    {
        "id": "SEB-A",
        "ticker": "SEB-A",
        "isin": "SE0000148884",
        "name": "Skandinaviska Enskilda Banken A",
        "sector": "Bank & Finans",
        "market": "XSTO",
        "is_seed_data": 1,
    },
    {
        "id": "SAND",
        "ticker": "SAND",
        "isin": "SE0000695807",
        "name": "Sandvik AB",
        "sector": "Industri",
        "market": "XSTO",
        "is_seed_data": 1,
    },
]

# Rich financial reports (in MSEK except EPS) for 2022-2024 and 2024 Quarters
SEED_FINANCIAL_REPORTS = [
    # VOLVO AB B
    {"id": "VOLV-2024-Q4", "company_ticker": "VOLV-B", "period": "2024-Q4", "period_type": "QUARTER", "report_type": "CONSOLIDATED", "revenue": 148100, "operating_income": 18400, "pre_tax_income": 18200, "net_income": 14100, "gross_profit": 39500, "eps": 6.94, "total_assets": 612000, "total_equity": 185000, "net_debt": 22000, "operating_cash_flow": 21500, "capex": -4200, "free_cash_flow": 17300},
    {"id": "VOLV-2024-Q3", "company_ticker": "VOLV-B", "period": "2024-Q3", "period_type": "QUARTER", "report_type": "CONSOLIDATED", "revenue": 133200, "operating_income": 15700, "pre_tax_income": 15500, "net_income": 11900, "gross_profit": 34800, "eps": 5.85, "total_assets": 598000, "total_equity": 179000, "net_debt": 24500, "operating_cash_flow": 16800, "capex": -3900, "free_cash_flow": 12900},
    {"id": "VOLV-2024-Q2", "company_ticker": "VOLV-B", "period": "2024-Q2", "period_type": "QUARTER", "report_type": "CONSOLIDATED", "revenue": 140800, "operating_income": 19400, "pre_tax_income": 19200, "net_income": 14700, "gross_profit": 38100, "eps": 7.23, "total_assets": 591000, "total_equity": 174000, "net_debt": 19800, "operating_cash_flow": 18200, "capex": -4100, "free_cash_flow": 14100},
    {"id": "VOLV-2024-Q1", "company_ticker": "VOLV-B", "period": "2024-Q1", "period_type": "QUARTER", "report_type": "CONSOLIDATED", "revenue": 131200, "operating_income": 18150, "pre_tax_income": 18000, "net_income": 14100, "gross_profit": 36200, "eps": 6.92, "total_assets": 582000, "total_equity": 171000, "net_debt": 15400, "operating_cash_flow": 9800, "capex": -3500, "free_cash_flow": 6300},
    {"id": "VOLV-2023", "company_ticker": "VOLV-B", "period": "2023", "period_type": "FY", "report_type": "CONSOLIDATED", "revenue": 552800, "operating_income": 66800, "pre_tax_income": 66100, "net_income": 49800, "gross_profit": 144200, "eps": 24.50, "total_assets": 574000, "total_equity": 162000, "net_debt": 18200, "operating_cash_flow": 64500, "capex": -15200, "free_cash_flow": 49300},
    {"id": "VOLV-2022", "company_ticker": "VOLV-B", "period": "2022", "period_type": "FY", "report_type": "CONSOLIDATED", "revenue": 473500, "operating_income": 45700, "pre_tax_income": 45100, "net_income": 32900, "gross_profit": 118400, "eps": 16.18, "total_assets": 531000, "total_equity": 148000, "net_debt": 28100, "operating_cash_flow": 35800, "capex": -13100, "free_cash_flow": 22700},

    # INVESTOR B
    {"id": "INVE-2024-Q4", "company_ticker": "INVE-B", "period": "2024-Q4", "period_type": "QUARTER", "report_type": "CONSOLIDATED", "revenue": 16800, "operating_income": 28500, "pre_tax_income": 28100, "net_income": 27800, "gross_profit": 9200, "eps": 9.08, "total_assets": 895000, "total_equity": 782000, "net_debt": 31200, "operating_cash_flow": 8200, "capex": -950, "free_cash_flow": 7250},
    {"id": "INVE-2023", "company_ticker": "INVE-B", "period": "2023", "period_type": "FY", "report_type": "CONSOLIDATED", "revenue": 62400, "operating_income": 98400, "pre_tax_income": 97200, "net_income": 95800, "gross_profit": 34100, "eps": 31.25, "total_assets": 810000, "total_equity": 715000, "net_debt": 28900, "operating_cash_flow": 28400, "capex": -3200, "free_cash_flow": 25200},

    # H&M B
    {"id": "HM-2024-Q4", "company_ticker": "HM-B", "period": "2024-Q4", "period_type": "QUARTER", "report_type": "CONSOLIDATED", "revenue": 62600, "operating_income": 4510, "pre_tax_income": 4320, "net_income": 3380, "gross_profit": 31800, "eps": 2.08, "total_assets": 178000, "total_equity": 52400, "net_debt": 41200, "operating_cash_flow": 11400, "capex": -2900, "free_cash_flow": 8500},
    {"id": "HM-2023", "company_ticker": "HM-B", "period": "2023", "period_type": "FY", "report_type": "CONSOLIDATED", "revenue": 236000, "operating_income": 14500, "pre_tax_income": 14000, "net_income": 8750, "gross_profit": 121000, "eps": 5.35, "total_assets": 172000, "total_equity": 48900, "net_debt": 44800, "operating_cash_flow": 33900, "capex": -8800, "free_cash_flow": 25100},

    # SEB A
    {"id": "SEB-2024-Q4", "company_ticker": "SEB-A", "period": "2024-Q4", "period_type": "QUARTER", "report_type": "CONSOLIDATED", "revenue": 20400, "operating_income": 11800, "pre_tax_income": 11800, "net_income": 9420, "gross_profit": 20400, "eps": 4.45, "total_assets": 3650000, "total_equity": 218000, "net_debt": 0, "operating_cash_flow": 14200, "capex": -600, "free_cash_flow": 13600},
    {"id": "SEB-2023", "company_ticker": "SEB-A", "period": "2023", "period_type": "FY", "report_type": "CONSOLIDATED", "revenue": 80100, "operating_income": 47800, "pre_tax_income": 47800, "net_income": 38100, "gross_profit": 80100, "eps": 17.85, "total_assets": 3480000, "total_equity": 202000, "net_debt": 0, "operating_cash_flow": 52100, "capex": -2200, "free_cash_flow": 49900},

    # SANDVIK
    {"id": "SAND-2024-Q4", "company_ticker": "SAND", "period": "2024-Q4", "period_type": "QUARTER", "report_type": "CONSOLIDATED", "revenue": 31200, "operating_income": 5820, "pre_tax_income": 5600, "net_income": 4350, "gross_profit": 12800, "eps": 3.47, "total_assets": 164000, "total_equity": 82000, "net_debt": 32500, "operating_cash_flow": 6400, "capex": -1400, "free_cash_flow": 5000},
    {"id": "SAND-2023", "company_ticker": "SAND", "period": "2023", "period_type": "FY", "report_type": "CONSOLIDATED", "revenue": 126500, "operating_income": 23900, "pre_tax_income": 22800, "net_income": 17600, "gross_profit": 51900, "eps": 14.02, "total_assets": 158000, "total_equity": 78500, "net_debt": 34200, "operating_cash_flow": 22500, "capex": -5100, "free_cash_flow": 17400},
]

def seed_database():
    """Populates SQLite with benchmark company profiles, financial reports, and real 3y price data."""
    init_db()
    conn = get_db_connection()

    logger.info("Seeding company profiles and financial reports...")
    with conn:
        # 1. Insert Companies
        for comp in SEED_COMPANIES:
            conn.execute(
                """
                INSERT INTO companies (id, ticker, isin, name, sector, market, is_seed_data)
                VALUES (:id, :ticker, :isin, :name, :sector, :market, :is_seed_data)
                ON CONFLICT(ticker) DO UPDATE SET
                    name=excluded.name,
                    sector=excluded.sector,
                    isin=excluded.isin,
                    is_seed_data=1;
                """,
                comp,
            )

        # 2. Insert Financial Reports
        for report in SEED_FINANCIAL_REPORTS:
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
                    revenue=excluded.revenue,
                    operating_income=excluded.operating_income,
                    net_income=excluded.net_income,
                    eps=excluded.eps;
                """,
                report,
            )

    conn.close()
    logger.info("Companies and financial reports seeded successfully.")

    # 3. Download & Seed 3-Year Historical Price Data via yfinance
    logger.info("Downloading historical price data via yfinance...")
    for comp in SEED_COMPANIES:
        ticker = comp["ticker"]
        prices = PriceClient.get_historical_prices(ticker, period="3y")

        if prices:
            conn = get_db_connection()
            with conn:
                for p in prices:
                    p["company_ticker"] = ticker
                    conn.execute(
                        """
                        INSERT INTO price_series (company_ticker, date, open, high, low, close, volume)
                        VALUES (:company_ticker, :date, :open, :high, :low, :close, :volume)
                        ON CONFLICT(company_ticker, date) DO UPDATE SET
                            open=excluded.open,
                            high=excluded.high,
                            low=excluded.low,
                            close=excluded.close,
                            volume=excluded.volume;
                        """,
                        p,
                    )
            conn.close()
            logger.info(f"Seeded {len(prices)} price bars for {ticker}")

    logger.info("Database seeding complete!")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    seed_database()
