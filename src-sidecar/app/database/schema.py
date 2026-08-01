from app.database.connection import get_db_connection

CREATE_COMPANIES_TABLE = """
CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    ticker TEXT UNIQUE NOT NULL,
    isin TEXT,
    name TEXT NOT NULL,
    sector TEXT,
    market TEXT DEFAULT 'XSTO',
    is_seed_data INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_FINANCIAL_REPORTS_TABLE = """
CREATE TABLE IF NOT EXISTS financial_reports (
    id TEXT PRIMARY KEY,
    company_ticker TEXT NOT NULL,
    period TEXT NOT NULL, -- e.g. 2024-Q3, 2023
    period_type TEXT NOT NULL, -- QUARTER, FY, TTM
    report_type TEXT NOT NULL, -- CONSOLIDATED, PARENT
    revenue REAL,
    operating_income REAL,
    pre_tax_income REAL,
    net_income REAL,
    gross_profit REAL,
    eps REAL,
    total_assets REAL,
    total_equity REAL,
    net_debt REAL,
    operating_cash_flow REAL,
    capex REAL,
    free_cash_flow REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(company_ticker) REFERENCES companies(ticker)
);
"""

CREATE_PRICE_SERIES_TABLE = """
CREATE TABLE IF NOT EXISTS price_series (
    company_ticker TEXT NOT NULL,
    date TEXT NOT NULL,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    volume INTEGER,
    PRIMARY KEY (company_ticker, date),
    FOREIGN KEY(company_ticker) REFERENCES companies(ticker)
);
"""

CREATE_SETTINGS_TABLE = """
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

def init_db():
    """Initializes SQLite database tables."""
    conn = get_db_connection()
    with conn:
        conn.execute(CREATE_COMPANIES_TABLE)
        conn.execute(CREATE_FINANCIAL_REPORTS_TABLE)
        conn.execute(CREATE_PRICE_SERIES_TABLE)
        conn.execute(CREATE_SETTINGS_TABLE)
    conn.close()
