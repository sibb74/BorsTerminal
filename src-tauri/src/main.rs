// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let sidecar_command = app.shell().sidecar("sidecar");
            match sidecar_command {
                Ok(cmd) => {
                    if let Ok((mut rx, _child)) = cmd.spawn() {
                        tauri::async_runtime::spawn(async move {
                            while let Some(event) = rx.recv().await {
                                if let CommandEvent::Stderr(line) = event {
                                    eprintln!("[Sidecar Error]: {}", String::from_utf8_lossy(&line));
                                }
                            }
                        });
                    } else {
                        eprintln!("[Rust Setup]: Failed to spawn sidecar process.");
                    }
                }
                Err(err) => {
                    eprintln!("[Rust Setup]: Could not create sidecar command: {:?}", err);
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
