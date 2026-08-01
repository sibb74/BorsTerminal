import { logger } from "@/lib/logger";

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

const API_BASE_URL = "http://127.0.0.1:8000/api";

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
  const targetUrl = url.toString();

  logger.info("API", `[GET] ${targetUrl}`);
  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      logger.error("API", `[GET] ${targetUrl} -> HTTP ${res.status}`);
      throw new ApiError("Kunde inte hämta bolagslista");
    }
    const data = await res.json();
    logger.info("API", `[GET] ${targetUrl} -> 200 OK (${data.length} bolag)`);
    return data;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    logger.error("API", `[GET] ${targetUrl} -> FETCH FAILED`, err);
    throw new ApiError("Kopplingsfel till lokal backend (127.0.0.1:8000).");
  }
}

export async function fetchFinancials(ticker: string): Promise<{
  company: Company;
  reports: FinancialReport[];
  ttm: TtmMetrics;
}> {
  const targetUrl = `${API_BASE_URL}/financials/${ticker.toUpperCase()}`;
  logger.info("API", `[GET] ${targetUrl}`);
  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      if (res.status === 404 && errData.detail && typeof errData.detail === "object" && errData.detail.code === "DEMO_MODE_RESTRICTION") {
        logger.warn("API", `[GET] ${targetUrl} -> 404 DEMO_MODE_RESTRICTION`, errData.detail);
        throw new ApiError(errData.detail.message, "DEMO_MODE_RESTRICTION", ticker);
      }
      logger.error("API", `[GET] ${targetUrl} -> HTTP ${res.status}`, errData);
      throw new ApiError(`Kunde inte hämta rapporter för ${ticker}`);
    }
    const data = await res.json();
    logger.info("API", `[GET] ${targetUrl} -> 200 OK (${data.reports?.length || 0} rapporter)`);
    return data;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    logger.error("API", `[GET] ${targetUrl} -> FETCH FAILED`, err);
    throw new ApiError(`Kopplingsfel vid hämtning av ${ticker}.`);
  }
}

export async function fetchPriceSeries(ticker: string): Promise<{
  ticker: string;
  count: number;
  candles: PriceCandle[];
}> {
  const targetUrl = `${API_BASE_URL}/price/${ticker.toUpperCase()}`;
  try {
    const res = await fetch(targetUrl);
    if (!res.ok) {
      logger.warn("API", `[GET] ${targetUrl} -> HTTP ${res.status}`);
      throw new ApiError(`Kunde inte hämta prisdata för ${ticker}`);
    }
    const data = await res.json();
    logger.info("API", `[GET] ${targetUrl} -> 200 OK (${data.candles?.length || 0} candles)`);
    return data;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    logger.warn("API", `[GET] ${targetUrl} -> FETCH FAILED`);
    throw err;
  }
}

export async function fetchValuationMultiples(ticker: string): Promise<ValuationMultiples> {
  const targetUrl = `${API_BASE_URL}/indicators/${ticker.toUpperCase()}`;
  try {
    const res = await fetch(targetUrl);
    if (!res.ok) throw new ApiError(`Kunde inte hämta nyckeltal för ${ticker}`);
    return await res.json();
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw err;
  }
}

export interface ApiKeyStatus {
  has_key: boolean;
}

export async function fetchApiKeyStatus(): Promise<ApiKeyStatus> {
  const targetUrl = `${API_BASE_URL}/settings/api-key`;
  try {
    const res = await fetch(targetUrl);
    if (!res.ok) throw new ApiError("Kunde inte hämta API-nyckelstatus");
    const data = await res.json();
    logger.info("API", `[GET] ${targetUrl} -> 200 OK (has_key: ${data.has_key})`);
    return data;
  } catch (err: any) {
    logger.warn("API", `[GET] ${targetUrl} -> FETCH FAILED`);
    return { has_key: false };
  }
}

export async function saveApiKey(apiKey: string): Promise<ApiKeyStatus> {
  const targetUrl = `${API_BASE_URL}/settings/api-key`;
  logger.info("API", `[PUT] ${targetUrl} (Validerar nyckel...)`);
  try {
    const res = await fetch(targetUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      let msg = "Ogiltig BörsAPI-nyckel.";
      if (typeof errData.detail === "string") {
        msg = errData.detail;
      } else if (errData.detail && typeof errData.detail === "object" && errData.detail.message) {
        msg = errData.detail.message;
      }
      logger.error("API", `[PUT] ${targetUrl} -> HTTP ${res.status}: ${msg}`, errData);
      throw new ApiError(msg);
    }
    const data = await res.json();
    logger.info("API", `[PUT] ${targetUrl} -> 200 OK (BörsAPI nyckel validerad och sparad!)`);
    return data;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    logger.error("API", `[PUT] ${targetUrl} -> FETCH FAILED`, err);
    throw new ApiError(err?.message || "Kopplingsfel till lokal backend.");
  }
}

export async function deleteApiKey(): Promise<ApiKeyStatus> {
  const targetUrl = `${API_BASE_URL}/settings/api-key`;
  logger.info("API", `[DELETE] ${targetUrl}`);
  try {
    const res = await fetch(targetUrl, {
      method: "DELETE",
    });
    if (!res.ok) throw new ApiError("Kunde inte ta bort API-nyckeln.");
    const data = await res.json();
    logger.info("API", `[DELETE] ${targetUrl} -> 200 OK`);
    return data;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    logger.error("API", `[DELETE] ${targetUrl} -> FETCH FAILED`, err);
    throw new ApiError("Kopplingsfel till lokal backend.");
  }
}
