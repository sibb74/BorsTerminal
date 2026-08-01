import React, { useState } from "react";
import { Search, ChevronRight } from "lucide-react";
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
    <aside className="w-64 bg-[#0a0a0a] border-r border-[#262626] flex flex-col h-full select-none font-mono">
      {/* Search Input Box */}
      <div className="p-2 border-b border-[#262626]">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="SÖK TICKER / NAMN [ENTER]..."
            className="w-full bg-[#000000] border border-[#262626] rounded-none pl-8 pr-2 py-1.5 text-xs focus:outline-none focus:border-neutral-500 text-neutral-100 placeholder-neutral-600 font-mono uppercase tracking-wider"
          />
        </div>
      </div>

      <div className="p-2 border-b border-[#262626] text-[10px] font-mono text-neutral-400 uppercase tracking-widest px-3 flex items-center justify-between bg-[#050505]">
        <span>BOLAGSLISTA</span>
        <span className="text-neutral-300 font-bold">{companies.length} ANSLUTNA</span>
      </div>

      {/* Stock Watchlist Items */}
      <nav className="flex-1 overflow-y-auto p-1 space-y-0.5">
        {filteredCompanies.map((stock) => {
          const isSelected = selectedTicker === stock.ticker;
          return (
            <button
              key={stock.ticker}
              onClick={() => onSelectTicker(stock.ticker)}
              className={`w-full text-left p-2 rounded-none transition-none flex items-center justify-between text-xs font-mono group border ${
                isSelected
                  ? "bg-[#171717] text-white border-[#404040]"
                  : "bg-transparent hover:bg-[#121212] text-neutral-300 border-transparent"
              }`}
            >
              <div className="space-y-0.5 flex-1 min-w-0 pr-2">
                <div className="flex items-center space-x-1.5">
                  <span className="text-neutral-50 font-bold tracking-wider truncate">
                    {stock.ticker}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 truncate">
                  {stock.name}
                </div>
              </div>

              <div className="flex items-center space-x-1 text-neutral-400 shrink-0">
                <span className="text-[9px] bg-[#000000] px-1.5 py-0.5 rounded-none border border-[#262626] text-neutral-400 uppercase">
                  {stock.market || "XSTO"}
                </span>
                <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "opacity-0 group-hover:opacity-100 text-neutral-500"}`} />
              </div>
            </button>
          );
        })}

        {filteredCompanies.length === 0 && (
          <div className="p-4 text-center text-xs text-neutral-500 font-mono space-y-3">
            <p className="uppercase break-all">INGET BOLAG HITTADES FÖR "{searchTerm}".</p>
            <button
              onClick={() => onSearchSubmit(searchTerm)}
              className="px-3 py-1.5 bg-[#171717] hover:bg-[#262626] text-white border border-[#404040] text-xs font-bold uppercase tracking-wider transition-none"
            >
              [ SÖK & HÄMTA "{searchTerm.toUpperCase()}" ]
            </button>
          </div>
        )}
      </nav>
    </aside>
  );
};
