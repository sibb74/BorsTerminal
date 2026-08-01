export interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR";
  source: string;
  message: string;
  details?: string;
}

type LogListener = (logs: LogEntry[]) => void;

class TerminalLogger {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 150;

  private getTimestamp(): string {
    const d = new Date();
    return d.toTimeString().split(" ")[0] + "." + d.getMilliseconds().toString().padStart(3, "0");
  }

  public addLog(level: "INFO" | "WARN" | "ERROR", source: string, message: string, details?: any): LogEntry {
    const detailStr = details
      ? typeof details === "string"
        ? details
        : JSON.stringify(details, null, 2)
      : undefined;

    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: this.getTimestamp(),
      level,
      source,
      message,
      details: detailStr,
    };

    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    this.notify();
    return entry;
  }

  public info(source: string, message: string, details?: any) {
    return this.addLog("INFO", source, message, details);
  }

  public warn(source: string, message: string, details?: any) {
    return this.addLog("WARN", source, message, details);
  }

  public error(source: string, message: string, details?: any) {
    return this.addLog("ERROR", source, message, details);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clear() {
    this.logs = [];
    this.notify();
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const current = [...this.logs];
    this.listeners.forEach((l) => l(current));
  }
}

export const logger = new TerminalLogger();
