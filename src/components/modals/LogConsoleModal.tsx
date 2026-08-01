import React, { useState, useEffect } from "react";
import { X, Copy, Trash2, Check, Terminal } from "lucide-react";
import { logger, LogEntry } from "@/lib/logger";

interface LogConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LogConsoleModal: React.FC<LogConsoleModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"ALL" | "ERROR" | "WARN" | "INFO">("ALL");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((l) => {
    if (filter === "ALL") return true;
    return l.level === filter;
  });

  const handleCopyLogs = () => {
    const text = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.level}] [${l.source}] ${l.message}${
            l.details ? `\n  Details: ${l.details}` : ""
          }`
      )
      .join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearLogs = () => {
    logger.clear();
  };

  const errorCount = logs.filter((l) => l.level === "ERROR").length;
  const warnCount = logs.filter((l) => l.level === "WARN").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 select-none font-mono">
      <div className="relative w-full max-w-4xl h-[600px] bg-[#000000] border border-[#333333] rounded-none flex flex-col overflow-hidden font-mono shadow-2xl">
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#0a0a0a] border-b border-[#262626] text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-white font-bold tracking-widest">
              <Terminal className="w-4 h-4 text-neutral-300" />
              <span>[ SYSTEMLOGGAR & DIAGNOSTIK ]</span>
            </div>
            <span className="text-[10px] text-neutral-500">
              {logs.length} HÄNDELSER ({errorCount > 0 ? `${errorCount} FEL` : "0 FEL"})
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyLogs}
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#171717] hover:bg-[#262626] text-neutral-200 border border-[#404040] text-xs transition-none"
              title="Kopiera alla loggar för felsökning"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "[ KOPIERAT ]" : "[ KOPIERA LOGGAR ]"}</span>
            </button>

            <button
              onClick={handleClearLogs}
              className="flex items-center space-x-1.5 px-3 py-1 bg-[#171717] hover:bg-[#262626] text-neutral-200 border border-[#404040] text-xs transition-none"
              title="Rensa loggar"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>[ RENSA ]</span>
            </button>

            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-1 ml-2 transition-none"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#050505] border-b border-[#262626] text-[11px]">
          <span className="text-neutral-500 uppercase tracking-widest mr-2">FILTER:</span>
          {(["ALL", "ERROR", "WARN", "INFO"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-0.5 border ${
                filter === f
                  ? "bg-[#171717] text-white border-[#404040] font-bold"
                  : "bg-transparent text-neutral-400 border-transparent hover:text-neutral-200"
              }`}
            >
              [{f} {f === "ERROR" && errorCount > 0 ? `(${errorCount})` : f === "WARN" && warnCount > 0 ? `(${warnCount})` : ""}]
            </button>
          ))}
        </div>

        {/* Terminal Log Console Output */}
        <div className="flex-1 bg-[#000000] p-3 overflow-y-auto font-mono text-xs space-y-2 select-text">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-neutral-600 text-xs">
              INGA LOGGAR ATT VISA FÖR TILLFÄLLET.
            </div>
          ) : (
            filteredLogs.map((log) => {
              let levelColor = "text-neutral-300";
              let badgeColor = "bg-[#171717] text-neutral-300 border-[#333333]";
              if (log.level === "ERROR") {
                levelColor = "text-red-400";
                badgeColor = "bg-red-950/60 text-red-400 border-red-800/80";
              } else if (log.level === "WARN") {
                levelColor = "text-neutral-300";
                badgeColor = "bg-[#1f1a0e] text-neutral-300 border-neutral-700";
              } else if (log.level === "INFO") {
                levelColor = "text-neutral-200";
                badgeColor = "bg-[#0a0a0a] text-neutral-400 border-[#262626]";
              }

              return (
                <div key={log.id} className="border-b border-[#121212] pb-2 font-mono">
                  <div className="flex items-start space-x-2">
                    <span className="text-neutral-500 shrink-0 text-[10px] pt-0.5">
                      [{log.timestamp}]
                    </span>
                    <span className={`px-1.5 py-0.2 text-[9px] border shrink-0 uppercase ${badgeColor}`}>
                      {log.level}
                    </span>
                    <span className="text-neutral-400 shrink-0 text-[10px] uppercase font-bold">
                      [{log.source}]
                    </span>
                    <span className={`flex-1 break-all ${levelColor}`}>{log.message}</span>
                  </div>
                  {log.details && (
                    <pre className="mt-1 ml-24 p-2 bg-[#080808] border border-[#1a1a1a] text-[10px] text-neutral-400 overflow-x-auto">
                      {log.details}
                    </pre>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Console Footer */}
        <div className="px-3 py-1.5 bg-[#050505] border-t border-[#262626] text-[10px] text-neutral-500 flex items-center justify-between">
          <span>KOPPLING: HTTP 127.0.0.1:8000 &bull; BÖRSAPI PROXIED</span>
          <span>TRYCK ESC ELLER [ X ] FÖR ATT STÄNGA</span>
        </div>
      </div>
    </div>
  );
};
