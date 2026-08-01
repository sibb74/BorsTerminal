import React from "react";
import { ExternalLink, Key, ShieldAlert, X, Trash2, Loader2 } from "lucide-react";

interface FreemiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker?: string;
  hasApiKey?: boolean;
  onSaveApiKey?: (key: string) => Promise<boolean>;
  onDeleteApiKey?: () => void;
}

export const FreemiumModal: React.FC<FreemiumModalProps> = ({
  isOpen,
  onClose,
  ticker,
  hasApiKey = false,
  onSaveApiKey,
  onDeleteApiKey,
}) => {
  const [keyInput, setKeyInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = keyInput.trim();
    if (!trimmed || !onSaveApiKey) return;
    setSaving(true);
    setError(null);
    try {
      const ok = await onSaveApiKey(trimmed);
      if (ok) {
        setKeyInput("");
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || "KUNDE INTE SPARA NYCKELN.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (onDeleteApiKey) {
      await onDeleteApiKey();
    }
    setKeyInput("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 select-none font-mono">
      <div className="relative w-full max-w-lg bg-[#000000] border border-[#333333] rounded-none overflow-hidden font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#262626] bg-[#0a0a0a]">
          <div className="flex items-center space-x-2 text-white font-bold">
            <Key className="w-4 h-4 text-neutral-300" />
            <h2 className="text-xs tracking-widest uppercase">
              {hasApiKey ? "[ BÖRSAPI STATUS: ANSLUTEN ]" : "[ DEMO MODE BEGRÄNSNING ]"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-none transition-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-neutral-300">
          {hasApiKey ? (
            <div className="flex items-start space-x-3 bg-[#0a0a0a] border border-green-500/40 p-3 text-neutral-200">
              <Key className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-green-500">LIVE BÖRSAPI ANSLUTEN.</span> Hela den svenska marknaden är tillgänglig.
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start space-x-3 bg-[#0a0a0a] border border-[#333333] p-3 text-neutral-300">
                <ShieldAlert className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">BEGRÄNSNING:</span> Ticker{" "}
                  <span className="font-bold text-white">{ticker || "VALD AKTIE"}</span>{" "}
                  finns ej i lokal seed-databas.
                </div>
              </div>

              <p className="leading-relaxed text-neutral-400">
                BörsTerminal levereras i <span className="text-white">Demo Mode</span> med förinläst data för 5 storbolag (VOLV-B, INVE-B, HM-B, SEB-A, SAND).
              </p>

              <div className="bg-[#0a0a0a] border border-[#262626] p-3.5 space-y-2.5">
                <div className="font-bold text-neutral-100 flex items-center space-x-2">
                  <span>FREEMIUM AUTO-PROVISIONING (30 SEK)</span>
                </div>
                <p className="text-neutral-400 text-[11px]">
                  Skapa ett konto på BörsAPI för att direkt få en gratis API-nyckel (100 anrop) och låsa upp alla svenska bolag.
                </p>
                <a
                  href="https://borsapi.se/register?ref=borsterminal"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-2 bg-[#171717] hover:bg-[#262626] text-white font-bold px-3 py-1.5 border border-[#404040] transition-none text-xs"
                >
                  <span>[ HÄMTA GRATIS API-NYCKEL PÅ BÖRSAPI.SE ]</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          )}

          {/* Quick API Key Input Form */}
          <form onSubmit={handleSave} className={`${hasApiKey ? "" : "pt-2 border-t border-[#262626]"} space-y-2`}>
            <label className="block text-[10px] uppercase tracking-wider text-neutral-400">
              {hasApiKey ? "ERSÄTT BEFINTLIG API-NYCKEL:" : "ANGE BÖRSAPI-NYCKEL (FD_...):"}
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="fd_..."
                className="flex-1 bg-[#000000] border border-[#333333] rounded-none px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-neutral-400"
              />
              <button
                type="submit"
                disabled={!keyInput.trim() || saving}
                className="bg-[#171717] hover:bg-[#262626] disabled:opacity-40 text-white font-mono px-4 py-1.5 border border-[#404040] text-xs transition-none inline-flex items-center space-x-1"
              >
                {saving && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>[ SPARA ]</span>
              </button>
            </div>
            {error && <p className="text-red-500 font-mono text-[10px]">{error}</p>}
          </form>

          {hasApiKey && (
            <div className="pt-2 border-t border-[#262626]">
              <button
                onClick={handleDelete}
                className="inline-flex items-center space-x-2 text-xs bg-[#0a0a0a] hover:bg-red-950/40 text-neutral-300 hover:text-red-400 px-3 py-1.5 border border-[#333333] transition-none"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>[ TA BORT NYCKEL / DEMO MODE ]</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
