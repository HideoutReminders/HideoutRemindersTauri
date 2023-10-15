// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::File;
use std::env;
use rev_lines::RevLines;
use serde_json::json;
use serde::Serialize;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct PoEClientStatus {
	zone_name: String,
	afk: bool,
	zone_changed_at: String,
	most_recent_line_at: String
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ErrorResponse {
	success: bool,
	message: String,
}

// Given a string it returns a JSON string response that the React app can interpret
fn error_res(msg: String) -> String {
	let err = ErrorResponse {
		success: false,
		message: msg.to_string(),
	};
	let j = serde_json::to_string(&err).expect(err);
  format!("{}", j)
}

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn remind(text: &str, at: &str) -> String {
    format!("Remember to {text} ({at})")
}

#[tauri::command]
fn poe_status(client_txt_path: &str) -> String {
	let date_len = "2023/10/14 03:08:35".len();
	let zone_change_prefix = "] : You have entered ";
	println!("client_txt_path: {client_txt_path}");

	let fp: &str = client_txt_path;
	if fp == "" {
		return error_res("No client txt path provided");
	}

	println!("path: {fp}");
  let file = File::open(fp).unwrap();
  let rev_lines = RevLines::new(file);

	let mut num = 1;

	let mut poe_status = PoEClientStatus {
		zone_changed_at: String::from(""),
		zone_name: String::from(""),
		afk: false,
		most_recent_line_at: String::from(""),
	};

	for line in rev_lines {
		println!("{num} {:?}", line);

		num = num + 1;
		if num >= 1000 {
			println!("Stopped searching after {num} lines");
			break;
		}

		// Gets the current line as a string
		let txt: String = match line {
			Ok(line) => String::from(line),
			Err(ex) => {
				return error_res(ex.to_string());
			}
		};

		// Skip blank lines
		if txt.len() == 0 {
			continue
		}

		// Get the date of the current line we are reading
		let date = txt[0..date_len].to_string();

		// We're reading in reverse order, so the first date we encounter will be the most recent date
		if poe_status.most_recent_line_at == "" {
			poe_status.most_recent_line_at = date.clone();
		}

		let sans_date = txt[date_len..].to_string();
		println!("sans_date {sans_date}");

		if let Some(found) = txt.find(zone_change_prefix) {
				println!("Found at idx {found}");
				let start = found + zone_change_prefix.len();
				let slice = &txt[start..];
				poe_status.zone_name = format!("{slice}");
				poe_status.zone_changed_at = date;
				break;
		}
		else {
			println!("No zone change found");
			// TODO: Look for a line saying you're AFK or not afk
			continue
		}
	}
	let err = error_res("Could not serialize JSON");
	let j = serde_json::to_string(&poe_status).expect(err);
  format!("{}", j)
}


fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            poe_status,
            remind,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
