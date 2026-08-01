export interface Company {
  id: string;
  ticker: string;
  isin: string;
  name: string;
  sector: string;
  market: string;
  is_seed_data: number;
}

export interface FinancialReport {
  id: string;
  company_ticker: string;
  period: string;
  period_type: string;
  report_type: string;
  revenue: number | null;
  operating_income: number | null;
  pre_tax_income: number | null;
  net_income: number | null;
  gross_profit: number | null;
  eps: number | null;
  total_assets: number | null;
  total_equity: number | null;
  net_debt: number | null;
  operating_cash_flow: number | null;
  capex: number | null;
  free_cash_flow: number | null;
}

export interface TtmMetrics {
  ticker: string;
  ttm_source: string;
  revenue_ttm: number | null;
  operating_income_ttm: number | null;
  net_income_ttm: number | null;
  gross_profit_ttm: number | null;
  eps_ttm: number | null;
  free_cash_flow_ttm: number | null;
  operating_margin_pct: number | null;
  net_margin_pct: number | null;
  total_assets: number | null;
  total_equity: number | null;
  net_debt: number | null;
}

export interface PriceCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma50: number | null;
  sma200: number | null;
}

export interface ValuationMultiples {
  ticker: string;
  latest_price: number | null;
  price_date: string | null;
  pe_ttm: number | null;
  operating_margin_pct: number | null;
  net_margin_pct: number | null;
  revenue_ttm: number | null;
  net_income_ttm: number | null;
  eps_ttm: number | null;
  free_cash_flow_ttm: number | null;
  net_debt: number | null;
}

const API_BASE_URL = "http://localhost:8000/api";

export class ApiError extends Error {
  code?: string;
  ticker?: string;
  constructor(message: string, code?: string, ticker?: string) {
    super(message);
    this.code = code;
    this.ticker = ticker;
  }
}

export async function fetchCompanies(search?: string): Promise<Company[]> {
  const url = new URL(`${API_BASE_URL}/companies`);
  if (search) url.searchParams.append("search", search);
  const res = await fetch(url.toString());
  if (!res.ok) throw new ApiError("Kunna inte hämta bolagslista");
  return res.json();
}

export async function fetchFinancials(ticker: string): Promise<{
  company: Company;
  reports: FinancialReport[];
  ttm: TtmMetrics;
}> {
  const res = await fetch(`${API_BASE_URL}/financials/${ticker.toUpperCase()}`);
  if (!res.ok) {
    if (res.status === 404) {
      const errData = await res.json().catch(() => ({}));
      if (errData.detail && typeof errData.detail === "object" && errData.detail.code === "DEMO_MODE_RESTRICTION") {
        throw new ApiError(errData.detail.message, "DEMO_MODE_RESTRICTION", ticker);
      }
    }
    throw new ApiError(`Kunde inte hämta rapporter för ${ticker}`);
  }
  return res.json();
}

export async function fetchPriceSeries(ticker: string): Promise<{
  ticker: string;
  count: number;
  candles: PriceCandle[];
}> {
  const res = await fetch(`${API_BASE_URL}/price/${ticker.toUpperCase()}`);
  if (!res.ok) throw new ApiError(`Kunde inte hämta prisdata för ${ticker}`);
  return res.json();
}

export async function fetchValuationMultiples(ticker: string): Promise<ValuationMultiples> {
  const res = await fetch(`${API_BASE_URL}/indicators/${ticker.toUpperCase()}`);
  if (!res.ok) throw new ApiError(`Kunde inte hämta nyckeltal för ${ticker}`);
  return res.json();
}

export interface ApiKeyStatus {
  has_key: boolean;
}

export async function fetchApiKeyStatus(): Promise<ApiKeyStatus> {
  const res = await fetch(`${API_BASE_URL}/settings/api-key`);
  if (!res.ok) throw new ApiError("Kunde inte hämta API-nyckelstatus");
  return res.json();
}

export async function saveApiKey(apiKey: string): Promise<ApiKeyStatus> {
  const res = await fetch(`${API_BASE_URL}/settings/api-key`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new ApiError(errData.detail || "Ogiltig BörsAPI-nyckel.");
  }
  return res.json();
}

export async function deleteApiKey(): Promise<ApiKeyStatus> {
  const res = await fetch(`${API_BASE_URL}/settings/api-key`, {
    method: "DELETE",
  });
  if (!res.ok) throw new ApiError("Kunde inte ta bort API-nyckeln.");
  return res.json();
}
