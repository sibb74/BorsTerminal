import React, { useState } from "react";
import { FinancialReport } from "@/lib/api";

interface FinancialTableProps {
  reports: FinancialReport[];
}

export const FinancialTable: React.FC<FinancialTableProps> = ({ reports }) => {
  const [activeTab, setActiveTab] = useState<"RR" | "BR" | "KA">("RR");

  if (!reports || reports.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs font-mono">
        Inga finansiella rapporter tillgängliga för valt bolag.
      </div>
    );
  }

  // Format currency numbers cleanly (e.g., 148 100 MSEK)
  const fmt = (val: number | null) => {
    if (val === null || val === undefined) return "-";
    const rounded = Math.round(val);
    return rounded.toLocaleString("sv-SE");
  };

  const fmtEps = (val: number | null) => {
    if (val === null || val === undefined) return "-";
    return val.toFixed(2) + " kr";
  };

  return (
    <div className="flex flex-col h-full bg-[#080d1a] border border-slate-800/80 rounded-lg overflow-hidden select-none">
      {/* Table Sub-Navigation Tabs */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#0d1425] border-b border-slate-800 text-xs font-mono">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("RR")}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === "RR"
                ? "bg-slate-800 text-white font-bold border border-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            Resultaträkning (RR)
          </button>
          <button
            onClick={() => setActiveTab("BR")}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === "BR"
                ? "bg-slate-800 text-white font-bold border border-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            Balansräkning (BR)
          </button>
          <button
            onClick={() => setActiveTab("KA")}
            className={`px-3 py-1 rounded transition-colors ${
              activeTab === "KA"
                ? "bg-slate-800 text-white font-bold border border-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            Kassaflöde (KA)
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-mono">Belopp i MSEK</span>
      </div>

      {/* Financial Data Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-[#0b101e] border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider">
              <th className="p-3 sticky left-0 bg-[#0b101e] min-w-[200px]">Rapportpost</th>
              {reports.map((r) => (
                <th key={r.id} className="p-3 text-right min-w-[110px]">
                  <div className="font-bold text-slate-200">{r.period}</div>
                  <div className="text-[9px] text-slate-500 font-normal">{r.period_type}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 text-slate-300">
            {activeTab === "RR" && (
              <>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 font-semibold text-slate-200 sticky left-0 bg-[#080d1a]">Nettoomsättning</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-3 text-right font-semibold text-slate-100">{fmt(r.revenue)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 text-slate-400 sticky left-0 bg-[#080d1a]">Bruttoresultat</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-3 text-right">{fmt(r.gross_profit)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-900/50 bg-slate-900/20">
                  <td className="p-3 font-semibold text-emerald-400 sticky left-0 bg-[#080d1a]">Rörelseresultat (EBIT)</td>
                  {reports.map((r) => (
                    <td key={r.id} className={`p-3 text-right font-bold ${(r.operating_income ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {fmt(r.operating_income)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 text-slate-400 sticky left-0 bg-[#080d1a]">Resultat före skatt</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-3 text-right">{fmt(r.pre_tax_income)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-900/50 bg-slate-900/40">
                  <td className="p-3 font-bold text-white sticky left-0 bg-[#080d1a]">Årets nettoresultat</td>
                  {reports.map((r) => (
                    <td key={r.id} className={`p-3 text-right font-bold ${(r.net_income ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {fmt(r.net_income)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 text-slate-400 sticky left-0 bg-[#080d1a]">Vinst per aktie (EPS)</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-3 text-right text-amber-300 font-semibold">{fmtEps(r.eps)}</td>
                  ))}
                </tr>
              </>
            )}

            {activeTab === "BR" && (
              <>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 font-semibold text-slate-200 sticky left-0 bg-[#080d1a]">Totala Tillgångar</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-3 text-right font-semibold text-slate-100">{fmt(r.total_assets)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 text-emerald-400 sticky left-0 bg-[#080d1a]">Eget Kapital</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-3 text-right font-semibold text-emerald-400">{fmt(r.total_equity)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 text-slate-400 sticky left-0 bg-[#080d1a]">Nettoskuld</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-3 text-right">{fmt(r.net_debt)}</td>
                  ))}
                </tr>
              </>
            )}

            {activeTab === "KA" && (
              <>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 font-semibold text-slate-200 sticky left-0 bg-[#080d1a]">Löpande kassaflöde</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-3 text-right font-semibold text-slate-100">{fmt(r.operating_cash_flow)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-900/50">
                  <td className="p-3 text-slate-400 sticky left-0 bg-[#080d1a]">Investeringar (Capex)</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-3 text-right text-red-400">{fmt(r.capex)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-slate-900/50 bg-slate-900/40">
                  <td className="p-3 font-bold text-emerald-400 sticky left-0 bg-[#080d1a]">Fritt Kassaflöde (FCF)</td>
                  {reports.map((r) => (
                    <td key={r.id} className={`p-3 text-right font-bold ${(r.free_cash_flow ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {fmt(r.free_cash_flow)}
                    </td>
                  ))}
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
