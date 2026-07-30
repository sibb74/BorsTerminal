import os
import sys
import platform
import subprocess
from pathlib import Path

def get_target_triple():
    """Determines the Rust target triple for naming the Tauri sidecar executable."""
    machine = platform.machine().lower()
    system = platform.system().lower()

    if system == "darwin":
        if machine in ["arm64", "aarch64"]:
            return "aarch64-apple-darwin"
        return "x86_64-apple-darwin"
    elif system == "windows":
        return "x86_64-pc-windows-msvc"
    elif system == "linux":
        return "x86_64-unknown-linux-gnu"
    else:
        raise RuntimeError(f"Unsupported system architecture: {system} {machine}")

def build_sidecar():
    """Compiles the Python FastAPI backend into a standalone Tauri sidecar binary using PyInstaller."""
    script_dir = Path(__file__).resolve().parent
    root_dir = script_dir.parent
    sidecar_dir = root_dir / "src-sidecar"
    tauri_bin_dir = root_dir / "src-tauri" / "binaries"

    tauri_bin_dir.mkdir(parents=True, exist_ok=True)

    target_triple = get_target_triple()
    binary_name = f"sidecar-{target_triple}"
    if platform.system().lower() == "windows":
        binary_name += ".exe"

    output_path = tauri_bin_dir / binary_name

    print(f"🚀 Building PyInstaller sidecar binary for target: {target_triple}")
    print(f"Output binary will be: {output_path}")

    # Hidden imports required for Uvicorn, FastAPI, Pandas, and YFinance
    hidden_imports = [
        "uvicorn.logging",
        "uvicorn.loops",
        "uvicorn.loops.auto",
        "uvicorn.protocols",
        "uvicorn.protocols.http",
        "uvicorn.protocols.http.auto",
        "fastapi",
        "pydantic",
        "pandas",
        "yfinance",
        "sqlite3",
        "httpx",
    ]

    pyinstaller_cmd = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--noconfirm",
        "--onedir" if "--debug" in sys.argv else "--onefile",
        "--name",
        binary_name.replace(".exe", ""),
        "--distpath",
        str(tauri_bin_dir),
    ]

    for imp in hidden_imports:
        pyinstaller_cmd.extend(["--hidden-import", imp])

    pyinstaller_cmd.append(str(sidecar_dir / "app" / "main.py"))

    print(f"Executing: {' '.join(pyinstaller_cmd)}")
    result = subprocess.run(pyinstaller_cmd, cwd=root_dir)

    if result.returncode == 0:
        print(f"✅ Sidecar binary built successfully at: {output_path}")
    else:
        print("❌ Failed to build PyInstaller sidecar binary.")
        sys.exit(result.returncode)

if __name__ == "__main__":
    build_sidecar()
