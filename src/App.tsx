import React, { useState, useEffect } from "react";
import {
  Activity,
  Database,
  ExternalLink,
  RefreshCw,
  BarChart2,
  Table as TableIcon,
} from "lucide-react";
import {
  fetchCompanies,
  fetchFinancials,
  fetchPriceSeries,
  fetchValuationMultiples,
  fetchApiKeyStatus,
  saveApiKey,
  deleteApiKey,
  Company,
  FinancialReport,
  PriceCandle,
  ValuationMultiples,
  TtmMetrics,
  ApiError,
} from "@/lib/api";
import { Sidebar } from "@/components/layout/Sidebar";
import { PriceChart } from "@/components/charts/PriceChart";
import { FinancialTable } from "@/components/financials/FinancialTable";
import { FreemiumModal } from "@/components/modals/FreemiumModal";

export default function App() {
  const [selectedTicker, setSelectedTicker] = useState("VOLV-B");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [ttm, setTtm] = useState<TtmMetrics | null>(null);
  const [candles, setCandles] = useState<PriceCandle[]>([]);
  const [multiples, setMultiples] = useState<ValuationMultiples | null>(null);

  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<"CHART" | "TABLE">("CHART");
  const [sidecarStatus, setSidecarStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [sidecarVersion, setSidecarVersion] = useState<string | null>(null);

  // Freemium Modal State
  const [isFreemiumModalOpen, setIsFreemiumModalOpen] = useState(false);
  const [restrictedTicker, setRestrictedTicker] = useState<string | undefined>();
  const [hasApiKey, setHasApiKey] = useState(false);

  // 1. Initial Sidecar Health Check & Companies List Fetch
  useEffect(() => {
    const init = async () => {
      try {
        const compList = await fetchCompanies();
        setCompanies(compList);
        setSidecarStatus("online");
        setSidecarVersion("1.0.0");
      } catch (err) {
        setSidecarStatus("offline");
      }

      try {
        const status = await fetchApiKeyStatus();
        setHasApiKey(status.has_key);
      } catch (err) {
        console.error("Failed to load API key status:", err);
      }
    };
    init();
  }, []);

  // 2. Fetch Selected Stock Data (Prices, Financials, Indicators)
  const loadStockData = async (ticker: string) => {
    setLoading(true);
    try {
      const [finRes, priceRes, indRes] = await Promise.all([
        fetchFinancials(ticker),
        fetchPriceSeries(ticker).catch(() => ({ candles: [] })),
        fetchValuationMultiples(ticker).catch(() => null),
      ]);

      setReports(finRes.reports);
      setTtm(finRes.ttm);
      setCandles(priceRes.candles);
      setMultiples(indRes);
    } catch (err) {
      if (err instanceof ApiError && err.code === "DEMO_MODE_RESTRICTION") {
        setRestrictedTicker(ticker);
        setIsFreemiumModalOpen(true);
      } else {
        console.error("Failed to load stock data:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStockData(selectedTicker);
  }, [selectedTicker]);

  const handleSaveApiKey = async (key: string) => {
    try {
      await saveApiKey(key);
      setHasApiKey(true);
      const compList = await fetchCompanies();
      setCompanies(compList);
      loadStockData(selectedTicker);
      return true;
    } catch (err) {
      console.error("Failed to save BörsAPI key:", err);
      throw err;
    }
  };

  const handleDeleteApiKey = async () => {
    try {
      await deleteApiKey();
      setHasApiKey(false);
      const compList = await fetchCompanies();
      setCompanies(compList);
    } catch (err) {
      console.error("Failed to delete BörsAPI key:", err);
    }
  };

  const fmtCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return "-";
    return Math.round(val).toLocaleString("sv-SE") + " MSEK";
  };

  const selectedCompany = companies.find((c) => c.ticker === selectedTicker) || {
    ticker: selectedTicker,
    name: selectedTicker === "VOLV-B" ? "Volvo AB B" : selectedTicker,
    sector: "Industri",
  };

  return (
    <div className="flex flex-col h-screen bg-[#000000] text-neutral-100 font-mono select-none overflow-hidden">
      {/* Top Bar / Terminal Header */}
      <header className="flex items-center justify-between px-3 py-2 bg-[#050505] border-b border-[#262626] text-xs font-mono">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 font-bold text-sm tracking-widest text-white">
            <Activity className="w-4 h-4 text-neutral-300" />
            <span>BÖRS TERMINAL</span>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] bg-[#171717] text-neutral-400 border border-[#262626]">
            v1.0.0-dev
          </span>
        </div>

        {/* Demo Mode / BörsAPI Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[#0a0a0a] border border-[#262626] px-2.5 py-1 text-neutral-300">
            <Database className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-xs">
              {hasApiKey ? "LIVE BÖRSAPI (NYCKEL ANSLUTEN)" : "DEMO MODE (LOKAL SQLITE SEED)"}
            </span>
            {hasApiKey ? (
              <button
                onClick={handleDeleteApiKey}
                className="ml-2 text-xs bg-[#171717] hover:bg-[#262626] text-neutral-300 px-2 py-0.5 border border-[#333333] transition-none"
                title="Ta bort BörsAPI-nyckel"
              >
                [ TA BORT NYCKEL ]
              </button>
            ) : (
              <button
                onClick={() => setIsFreemiumModalOpen(true)}
                className="ml-2 flex items-center space-x-1 text-xs bg-[#171717] hover:bg-[#262626] text-white font-bold px-2 py-0.5 border border-[#404040] transition-none"
              >
                <span>[ ANSLUT BÖRSAPI ]</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1.5 px-2 py-1 bg-[#0a0a0a] border border-[#262626]">
            <span
              className={`w-2 h-2 ${
                sidecarStatus === "online" ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-neutral-400 text-[11px] uppercase">
              SIDECAR: {sidecarStatus === "online" ? `v${sidecarVersion}` : sidecarStatus}
            </span>
          </div>
        </div>
      </header>

      {/* Main Terminal Workspace */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar Watchlist */}
        <Sidebar
          companies={companies}
          selectedTicker={selectedTicker}
          onSelectTicker={(ticker) => setSelectedTicker(ticker)}
          onSearchSubmit={(ticker) => {
            setSelectedTicker(ticker.toUpperCase());
          }}
        />

        {/* Center Stock Workspace */}
        <section className="flex-1 flex flex-col bg-[#000000] p-3 overflow-y-auto font-mono">
          {/* Stock Header Banner */}
          <div className="flex items-center justify-between mb-3 border-b border-[#262626] pb-2.5">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold tracking-widest text-white">
                  {selectedCompany.ticker}
                </h1>
                <span className="text-xs text-neutral-300 font-semibold">{selectedCompany.name}</span>
                <span className="text-[10px] px-2 py-0.5 bg-[#171717] text-neutral-400 border border-[#262626] uppercase">
                  {selectedCompany.sector}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                NASDAQ STOCKHOLM &bull; PANDAS TTM EVALUATED
              </p>
            </div>

            {/* View Switching & Actions */}
            <div className="flex items-center space-x-2">
              <div className="flex bg-[#0a0a0a] border border-[#262626] p-0.5 text-xs">
                <button
                  onClick={() => setActiveView("CHART")}
                  className={`flex items-center space-x-1.5 px-3 py-1 transition-none border ${
                    activeView === "CHART"
                      ? "bg-[#171717] text-white font-bold border-[#404040]"
                      : "text-neutral-400 hover:text-white border-transparent"
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5 text-neutral-300" />
                  <span>[ GRAF & TEKNISKT ]</span>
                </button>
                <button
                  onClick={() => setActiveView("TABLE")}
                  className={`flex items-center space-x-1.5 px-3 py-1 transition-none border ${
                    activeView === "TABLE"
                      ? "bg-[#171717] text-white font-bold border-[#404040]"
                      : "text-neutral-400 hover:text-white border-transparent"
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5 text-neutral-300" />
                  <span>[ FINANSIELLA RAPPORTER ]</span>
                </button>
              </div>

              <button
                onClick={() => loadStockData(selectedTicker)}
                className="flex items-center space-x-1 text-xs bg-[#0a0a0a] hover:bg-[#171717] text-neutral-300 px-3 py-1.5 border border-[#262626] transition-none"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-neutral-400 ${loading ? "animate-spin" : ""}`} />
                <span>UPPDATERA</span>
              </button>
            </div>
          </div>

          {/* Key Indicators Metric Grid */}
          <div className="grid grid-cols-5 gap-2.5 mb-3">
            <div className="bg-[#0a0a0a] border border-[#262626] p-2.5">
              <div className="text-[10px] text-neutral-400 uppercase tracking-widest">SENASTE PRIS</div>
              <div className="text-base font-bold text-white mt-0.5">
                {multiples?.latest_price ? `${multiples.latest_price} SEK` : "-"}
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">
                {multiples?.price_date || "STÄNGNINGSKURS"}
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#262626] p-2.5">
              <div className="text-[10px] text-neutral-400 uppercase tracking-widest">P/E-TAL (TTM)</div>
              <div className="text-base font-bold text-neutral-100 mt-0.5">
                {multiples?.pe_ttm ? `${multiples.pe_ttm}x` : "-"}
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">
                {ttm?.eps_ttm ? `EPS: ${ttm.eps_ttm} kr` : "-"}
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#262626] p-2.5">
              <div className="text-[10px] text-neutral-400 uppercase tracking-widest">RÖRELSEMARGINAL</div>
              <div className={`text-base font-bold mt-0.5 ${(ttm?.operating_margin_pct ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                {ttm?.operating_margin_pct ? `${ttm.operating_margin_pct}%` : "-"}
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">EBIT / OMSÄTTNING</div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#262626] p-2.5">
              <div className="text-[10px] text-neutral-400 uppercase tracking-widest">OMSÄTTNING (TTM)</div>
              <div className="text-base font-bold text-white mt-0.5">
                {fmtCurrency(ttm?.revenue_ttm)}
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">{ttm?.ttm_source || "RULLANDE 12M"}</div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#262626] p-2.5">
              <div className="text-[10px] text-neutral-400 uppercase tracking-widest">FRITT KASSAFLÖDE</div>
              <div className={`text-base font-bold mt-0.5 ${(ttm?.free_cash_flow_ttm ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                {fmtCurrency(ttm?.free_cash_flow_ttm)}
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">FCF TTM</div>
            </div>
          </div>

          {/* Primary View Workspace (TradingView Chart or Financial Table) */}
          <div className="flex-1 min-h-[400px]">
            {activeView === "CHART" ? (
              <PriceChart candles={candles} ticker={selectedTicker} />
            ) : (
              <FinancialTable reports={reports} />
            )}
          </div>
        </section>
      </main>

      {/* Freemium Auto-Provisioning Modal */}
      <FreemiumModal
        isOpen={isFreemiumModalOpen}
        onClose={() => setIsFreemiumModalOpen(false)}
        ticker={restrictedTicker}
        hasApiKey={hasApiKey}
        onSaveApiKey={handleSaveApiKey}
        onDeleteApiKey={handleDeleteApiKey}
      />
    </div>
  );
}
