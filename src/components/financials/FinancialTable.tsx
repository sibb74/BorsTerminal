import React, { useState } from "react";
import { FinancialReport } from "@/lib/api";

interface FinancialTableProps {
  reports: FinancialReport[];
}

export const FinancialTable: React.FC<FinancialTableProps> = ({ reports }) => {
  const [activeTab, setActiveTab] = useState<"RR" | "BR" | "KA">("RR");

  if (!reports || reports.length === 0) {
    return (
      <div className="p-8 text-center text-neutral-500 text-xs font-mono border border-[#262626] bg-[#000000]">
        INGA FINANSIELLA RAPPORTER TILLGÄNGLIGA FÖR VALT BOLAG.
      </div>
    );
  }

  // Format currency numbers cleanly
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
    <div className="flex flex-col h-full bg-[#000000] border border-[#262626] rounded-none overflow-hidden select-none font-mono">
      {/* Table Sub-Navigation Tabs */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0a0a0a] border-b border-[#262626] text-xs font-mono">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("RR")}
            className={`px-3 py-1 rounded-none text-xs transition-none border ${
              activeTab === "RR"
                ? "bg-[#171717] text-white font-bold border-[#404040]"
                : "bg-transparent text-neutral-400 border-transparent hover:text-neutral-200 hover:bg-[#121212]"
            }`}
          >
            [ RESULTATRÄKNING (RR) ]
          </button>
          <button
            onClick={() => setActiveTab("BR")}
            className={`px-3 py-1 rounded-none text-xs transition-none border ${
              activeTab === "BR"
                ? "bg-[#171717] text-white font-bold border-[#404040]"
                : "bg-transparent text-neutral-400 border-transparent hover:text-neutral-200 hover:bg-[#121212]"
            }`}
          >
            [ BALANSRÄKNING (BR) ]
          </button>
          <button
            onClick={() => setActiveTab("KA")}
            className={`px-3 py-1 rounded-none text-xs transition-none border ${
              activeTab === "KA"
                ? "bg-[#171717] text-white font-bold border-[#404040]"
                : "bg-transparent text-neutral-400 border-transparent hover:text-neutral-200 hover:bg-[#121212]"
            }`}
          >
            [ KASSAFLÖDE (KA) ]
          </button>
        </div>

        <span className="text-[10px] text-neutral-500 uppercase tracking-widest">BELOPP I MSEK</span>
      </div>

      {/* Financial Data Table */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-[#0a0a0a] border-b border-[#262626] text-neutral-400 text-[10px] uppercase tracking-wider">
              <th className="p-2.5 sticky left-0 bg-[#0a0a0a] min-w-[200px] border-r border-[#262626]">RAPPORTPOST</th>
              {reports.map((r) => (
                <th key={r.id} className="p-2.5 text-right min-w-[110px] border-r border-[#262626] last:border-r-0">
                  <div className="font-bold text-neutral-200">{r.period}</div>
                  <div className="text-[9px] text-neutral-500 font-normal">{r.period_type}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#171717] text-neutral-300">
            {activeTab === "RR" && (
              <>
                <tr className="hover:bg-[#0d0d0d]">
                  <td className="p-2.5 font-semibold text-neutral-100 sticky left-0 bg-[#000000] border-r border-[#262626]">NETTOOMSÄTTNING</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-2.5 text-right font-semibold text-neutral-100 border-r border-[#171717] last:border-r-0">{fmt(r.revenue)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-[#0d0d0d]">
                  <td className="p-2.5 text-neutral-400 sticky left-0 bg-[#000000] border-r border-[#262626]">BRUTTORESULTAT</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-2.5 text-right border-r border-[#171717] last:border-r-0">{fmt(r.gross_profit)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-[#0d0d0d] bg-[#0a0a0a]">
                  <td className="p-2.5 font-bold text-neutral-100 sticky left-0 bg-[#0a0a0a] border-r border-[#262626]">RÖRELSERESULTAT (EBIT)</td>
                  {reports.map((r) => (
                    <td key={r.id} className={`p-2.5 text-right font-bold border-r border-[#171717] last:border-r-0 ${(r.operating_income ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {fmt(r.operating_income)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-[#0d0d0d]">
                  <td className="p-2.5 text-neutral-400 sticky left-0 bg-[#000000] border-r border-[#262626]">RESULTAT FÖRE SKATT</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-2.5 text-right border-r border-[#171717] last:border-r-0">{fmt(r.pre_tax_income)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-[#0d0d0d] bg-[#0a0a0a]">
                  <td className="p-2.5 font-bold text-neutral-100 sticky left-0 bg-[#0a0a0a] border-r border-[#262626]">ÅRETS NETTORESULTAT</td>
                  {reports.map((r) => (
                    <td key={r.id} className={`p-2.5 text-right font-bold border-r border-[#171717] last:border-r-0 ${(r.net_income ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {fmt(r.net_income)}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-[#0d0d0d]">
                  <td className="p-2.5 text-neutral-400 sticky left-0 bg-[#000000] border-r border-[#262626]">VINST PER AKTIE (EPS)</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-2.5 text-right text-neutral-200 font-mono border-r border-[#171717] last:border-r-0">{fmtEps(r.eps)}</td>
                  ))}
                </tr>
              </>
            )}

            {activeTab === "BR" && (
              <>
                <tr className="hover:bg-[#0d0d0d]">
                  <td className="p-2.5 font-semibold text-neutral-100 sticky left-0 bg-[#000000] border-r border-[#262626]">TOTALA TILLGÅNGAR</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-2.5 text-right font-semibold text-neutral-100 border-r border-[#171717] last:border-r-0">{fmt(r.total_assets)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-[#0d0d0d]">
                  <td className="p-2.5 text-neutral-200 sticky left-0 bg-[#000000] border-r border-[#262626]">EGET KAPITAL</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-2.5 text-right font-semibold text-neutral-200 border-r border-[#171717] last:border-r-0">{fmt(r.total_equity)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-[#0d0d0d]">
                  <td className="p-2.5 text-neutral-400 sticky left-0 bg-[#000000] border-r border-[#262626]">NETTOSKULD</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-2.5 text-right border-r border-[#171717] last:border-r-0">{fmt(r.net_debt)}</td>
                  ))}
                </tr>
              </>
            )}

            {activeTab === "KA" && (
              <>
                <tr className="hover:bg-[#0d0d0d]">
                  <td className="p-2.5 font-semibold text-neutral-100 sticky left-0 bg-[#000000] border-r border-[#262626]">LÖPANDE KASSAFLÖDE</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-2.5 text-right font-semibold text-neutral-100 border-r border-[#171717] last:border-r-0">{fmt(r.operating_cash_flow)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-[#0d0d0d]">
                  <td className="p-2.5 text-neutral-400 sticky left-0 bg-[#000000] border-r border-[#262626]">INVESTERINGAR (CAPEX)</td>
                  {reports.map((r) => (
                    <td key={r.id} className="p-2.5 text-right text-neutral-300 border-r border-[#171717] last:border-r-0">{fmt(r.capex)}</td>
                  ))}
                </tr>
                <tr className="hover:bg-[#0d0d0d] bg-[#0a0a0a]">
                  <td className="p-2.5 font-bold text-neutral-100 sticky left-0 bg-[#0a0a0a] border-r border-[#262626]">FRITT KASSAFLÖDE (FCF)</td>
                  {reports.map((r) => (
                    <td key={r.id} className={`p-2.5 text-right font-bold border-r border-[#171717] last:border-r-0 ${(r.free_cash_flow ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
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
