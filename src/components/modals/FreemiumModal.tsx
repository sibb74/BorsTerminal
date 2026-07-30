import React from "react";
import { ExternalLink, Key, ShieldAlert, Sparkles, X } from "lucide-react";

interface FreemiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker?: string;
  onSaveApiKey?: (key: str) => void;
}

export const FreemiumModal: React.FC<FreemiumModalProps> = ({
  isOpen,
  onClose,
  ticker,
  onSaveApiKey,
}) => {
  const [keyInput, setKeyInput] = React.useState("");

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim() && onSaveApiKey) {
      onSaveApiKey(keyInput.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-lg bg-[#0b101e] border border-slate-800 rounded-xl shadow-2xl overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#0e1526]">
          <div className="flex items-center space-x-2 text-emerald-400">
            <Sparkles className="w-5 h-5" />
            <h2 className="font-bold text-sm tracking-wider uppercase font-mono">
              Lås upp hela den svenska marknaden
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs text-slate-300">
          <div className="flex items-start space-x-3 bg-amber-950/40 border border-amber-500/30 p-3 rounded-lg text-amber-200">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Demo Mode Begränsning:</span> Bolaget{" "}
              <span className="font-mono font-bold text-white">{ticker || "vald aktie"}</span>{" "}
              finns inte i den lokala frödatabasen.
            </div>
          </div>

          <p className="leading-relaxed">
            BörsTerminal levereras i **Demo Mode** med fullständig täckning för 5 svenska storbolag (*Volvo, Investor, H&M, SEB, Sandvik*).
          </p>

          <div className="bg-[#0f172a] border border-slate-800 p-4 rounded-lg space-y-3">
            <div className="font-semibold text-slate-100 flex items-center space-x-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>Skaffa gratis BörsAPI-nyckel (100 anrop)</span>
            </div>
            <p className="text-slate-400">
              Skapa ett konto på BörsAPI på 30 sekunder så får du en gratis nyckel för att låsa upp alla noterade svenska bolag.
            </p>
            <a
              href="https://borsapi.se/register?ref=borsterminal"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded transition-colors text-xs"
            >
              <span>Hämta gratis API-nyckel på BörsAPI.se</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Quick API Key Input Form */}
          <form onSubmit={handleSave} className="pt-2 border-t border-slate-800 space-y-2">
            <label className="block text-[11px] font-mono text-slate-400">
              Har du redan en nyckel? Klistra in den här:
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="fd_..."
                className="flex-1 bg-[#111827] border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!keyInput.trim()}
                className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-mono px-4 py-1.5 rounded border border-slate-700 text-xs transition-colors"
              >
                Spara
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
