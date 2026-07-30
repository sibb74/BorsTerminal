import React, { useState, useEffect } from "react";
import {
  Activity,
  Database,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  BarChart2,
  Table as TableIcon,
  AlertCircle,
} from "lucide-react";
import {
  fetchCompanies,
  fetchFinancials,
  fetchPriceSeries,
  fetchValuationMultiples,
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
    };
    init();
  }, []);

  // 2. Fetch Selected Stock Data (Prices, Financials, Indicators)
  const loadStockData = async (ticker: string) => {
    setLoading(true);
    try {
      // Parallel data fetching for sub-50ms render speed
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

  // Format currency helpers
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
    <div className="flex flex-col h-screen bg-[#070a12] text-slate-100 font-sans select-none overflow-hidden">
      {/* Top Bar / Header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-[#0d1322] border-b border-slate-800 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 font-mono font-bold text-sm tracking-wider text-emerald-400">
            <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>BÖRS TERMINAL</span>
          </div>
          <span className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 text-slate-400 rounded">
            v1.0.0-dev
          </span>
        </div>

        {/* Demo Mode / BörsAPI Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded text-emerald-300">
            <Database className="w-3.5 h-3.5" />
            <span className="font-mono">Demo Mode (Lokal SQLite Seed)</span>
            <a
              href="https://borsapi.se/register?ref=borsterminal"
              target="_blank"
              rel="noreferrer"
              className="ml-2 flex items-center space-x-1 text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-2.5 py-0.5 rounded transition-colors"
            >
              <span>Lås upp Live BörsAPI</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex items-center space-x-1.5 px-2 py-1 bg-slate-900 border border-slate-800 rounded font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                sidecarStatus === "online"
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                  : "bg-red-500"
              }`}
            />
            <span className="text-slate-400 text-[11px]">
              Sidecar: {sidecarStatus === "online" ? `v${sidecarVersion}` : sidecarStatus}
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
        <section className="flex-1 flex flex-col bg-[#050810] p-4 overflow-y-auto">
          {/* Stock Header Banner */}
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold font-mono tracking-wide text-white">
                  {selectedCompany.ticker}
                </h1>
                <span className="text-sm text-slate-300 font-semibold">{selectedCompany.name}</span>
                <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-400 font-mono rounded">
                  {selectedCompany.sector}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Pandas TTM Evaluated &bull; Svenska Börsen (Nasdaq Stockholm)
              </p>
            </div>

            {/* View Switching & Actions */}
            <div className="flex items-center space-x-3">
              <div className="flex bg-[#0b101e] border border-slate-800 p-0.5 rounded text-xs font-mono">
                <button
                  onClick={() => setActiveView("CHART")}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors ${
                    activeView === "CHART"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Graf & Tekniskt</span>
                </button>
                <button
                  onClick={() => setActiveView("TABLE")}
                  className={`flex items-center space-x-1.5 px-3 py-1 rounded transition-colors ${
                    activeView === "TABLE"
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Finansiella Rapporter</span>
                </button>
              </div>

              <button
                onClick={() => loadStockData(selectedTicker)}
                className="flex items-center space-x-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded border border-slate-700 transition-colors font-mono"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${loading ? "animate-spin" : ""}`} />
                <span>Uppdatera</span>
              </button>
            </div>
          </div>

          {/* Key Indicators Metric Grid */}
          <div className="grid grid-cols-5 gap-3 mb-4 font-mono">
            <div className="bg-[#0b101d] border border-slate-800/80 rounded p-3">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Senaste Pris</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {multiples?.latest_price ? `${multiples.latest_price} SEK` : "-"}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {multiples?.price_date || "Stängningskurs"}
              </div>
            </div>

            <div className="bg-[#0b101d] border border-slate-800/80 rounded p-3">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">P/E-Tal (TTM)</div>
              <div className="text-lg font-bold text-amber-400 mt-0.5">
                {multiples?.pe_ttm ? `${multiples.pe_ttm}x` : "-"}
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">
                {ttm?.eps_ttm ? `EPS TTM: ${ttm.eps_ttm} kr` : "-"}
              </div>
            </div>

            <div className="bg-[#0b101d] border border-slate-800/80 rounded p-3">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Rörelsemarginal</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {ttm?.operating_margin_pct ? `${ttm.operating_margin_pct}%` : "-"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">EBIT / Omsättning</div>
            </div>

            <div className="bg-[#0b101d] border border-slate-800/80 rounded p-3">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Omsättning (TTM)</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {fmtCurrency(ttm?.revenue_ttm)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{ttm?.ttm_source || "Rullande 12m"}</div>
            </div>

            <div className="bg-[#0b101d] border border-slate-800/80 rounded p-3">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Fritt Kassaflöde</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {fmtCurrency(ttm?.free_cash_flow_ttm)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">FCF TTM</div>
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
      />
    </div>
  );
}
