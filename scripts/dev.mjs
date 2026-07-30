import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("🚀 Starting BörsTerminal Development Suite...");

// 1. Start Python FastAPI Sidecar
console.log("🐍 Launching Python Sidecar (FastAPI on port 8000)...");
const sidecar = spawn(
  "python3",
  ["-m", "uvicorn", "app.main:app", "--app-dir", "src-sidecar", "--reload", "--port", "8000"],
  { cwd: rootDir, stdio: "inherit", shell: true }
);

// 2. Start Vite Frontend
console.log("⚡ Launching Vite Dev Server (port 1420)...");
const vite = spawn("npx", ["vite"], { cwd: rootDir, stdio: "inherit", shell: true });

// Handle shutdown cleanly
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down development processes...");
  sidecar.kill();
  vite.kill();
  process.exit(0);
});
