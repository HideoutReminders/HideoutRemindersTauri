// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::File;
use std::env;
use rev_lines::RevLines;
use serde_json::json;
use serde::Serialize;

#[derive(Serialize)]
struct PoEClientStatus {
	zone_name: String,
	afk: bool,
	zone_changed_at: String,
	most_recent_line_at: String,
	success: bool,
	reminder_prompt: String,
	reminder_at: String,
}

#[derive(Serialize)]
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
	let j = serde_json::to_string(&err).expect(&"{success: false, \"error\": \"Could not serialize error object\"}");
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

	let fp: &str = client_txt_path;
	if fp == "" {
		return error_res(String::from("No client txt path provided"));
	}

  let file = match File::open(fp) {
    Err(why) => return error_res(format!("Could not open file: {}", why)),
    Ok(file) => file,
  };
  let rev_lines = RevLines::new(file);

	let mut num = 1; // Count so we don't loop for too long
	let mut poe_status = PoEClientStatus {
		zone_changed_at: String::from(""),
		zone_name: String::from(""),
		afk: false,
		most_recent_line_at: String::from(""),
		success: true,
		reminder_at: String::from(""),
		reminder_prompt: String::from(""),
	};

	for line in rev_lines {

		num = num + 1;
		// TODO: Maybe make this a setting? My client.txt got spammed by an error uh oh happened
		if num >= 50000 {
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

		// Every line in the Client.txt starts with a date, so if the line is too short this probably
		// not a Client.txt file
		if txt.len() < date_len {
			return error_res(String::from("That doesn't look like a PoE client.txt file."));
		}

		// Get the date of the current line we are reading
		let date = txt[0..date_len].to_string();

		// We're reading in reverse order, so the first date we encounter will be the most recent date
		if poe_status.most_recent_line_at == "" {
			poe_status.most_recent_line_at = date.clone();
		}

		let sans_date = txt[date_len..].to_string();

		if let Some(found) = txt.find(zone_change_prefix) {
				let start = found + zone_change_prefix.len();
				let slice = &txt[start..txt.len()-1]; // -1 gets rid of the period at the end of the line
				poe_status.zone_name = format!("{slice}");
				poe_status.zone_changed_at = date;
				break;
		}
		else {
			//println!("No zone change found");
			// TODO: Look for a line saying you're AFK or not afk
			continue
		}
	}

	if num <= 1 {
			return error_res(String::from("Could not find any lines in Client.txt"));
	}

	if poe_status.most_recent_line_at == "" {
		return error_res(String::from("Could not find any dates in Client.txt"));
	}

	let err = error_res(String::from("Could not serialize JSON"));
	let j = serde_json::to_string(&poe_status).expect(&err);
  format!("{}", j)
}


fn main() {
    tauri::Builder::default()
		    .on_window_event(|event| match event.event() {
		      tauri::WindowEvent::CloseRequested { api, .. } => {
		        event.window().hide().unwrap();
		        api.prevent_close();
		      }
		      _ => {}
		    })
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            greet,
            poe_status,
            remind,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
