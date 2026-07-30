import React, { useState } from "react";
import { Search, Database, ChevronRight, TrendingUp } from "lucide-react";
import { Company } from "@/lib/api";

interface SidebarProps {
  companies: Company[];
  selectedTicker: string;
  onSelectTicker: (ticker: string) => void;
  onSearchSubmit: (searchTerm: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  companies,
  selectedTicker,
  onSelectTicker,
  onSearchSubmit,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCompanies = companies.filter(
    (c) =>
      c.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      onSearchSubmit(searchTerm.trim());
    }
  };

  return (
    <aside className="w-64 bg-[#090e1a] border-r border-slate-800/80 flex flex-col h-full select-none">
      {/* Search Input Box */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sök ticker (tryck Enter)..."
            className="w-full bg-[#111827] border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500/50 text-slate-200 placeholder-slate-500 font-mono"
          />
        </div>
      </div>

      <div className="p-2 border-b border-slate-800/50 text-[10px] font-mono text-slate-400 uppercase tracking-wider px-3 flex items-center justify-between">
        <span>Svenska Storbolag</span>
        <span className="text-emerald-400 font-bold">5 SEEDED</span>
      </div>

      {/* Stock Watchlist Items */}
      <nav className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {filteredCompanies.map((stock) => {
          const isSelected = selectedTicker === stock.ticker;
          return (
            <button
              key={stock.ticker}
              onClick={() => onSelectTicker(stock.ticker)}
              className={`w-full text-left p-2.5 rounded-lg transition-all flex items-center justify-between text-xs font-mono group ${
                isSelected
                  ? "bg-slate-800/90 text-white border border-slate-700/80 shadow-lg"
                  : "hover:bg-slate-900/80 text-slate-300 border border-transparent"
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-emerald-400 group-hover:text-emerald-300">
                    {stock.ticker}
                  </span>
                  {stock.is_seed_data === 1 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Offline Demo Data" />
                  )}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[130px] font-sans">
                  {stock.name}
                </div>
              </div>

              <div className="flex items-center space-x-1 text-slate-400 group-hover:text-slate-200">
                <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {stock.sector}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isSelected ? "translate-x-0.5 text-emerald-400" : "opacity-0 group-hover:opacity-100"}`} />
              </div>
            </button>
          );
        })}

        {filteredCompanies.length === 0 && (
          <div className="p-4 text-center text-xs text-slate-500 font-mono space-y-2">
            <p>Hittade inget seedat bolag matchande "{searchTerm}".</p>
            <button
              onClick={() => onSearchSubmit(searchTerm)}
              className="text-emerald-400 underline hover:text-emerald-300 text-[11px]"
            >
              Sök i BörsAPI Live databas &rarr;
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
};
