// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::File;
use std::env;
use rev_lines::RevLines;

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
fn recent_zone(client_txt_path: &str) -> String {
	let prefix = "] : You have entered ";
	println!("client_txt_path: {client_txt_path}");

	let mut fp: &str = client_txt_path;
	if fp == "" {
		return String::from("No client txt path provided");
	}

	println!("path: {fp}");
  let file = File::open(fp).unwrap();
  let rev_lines = RevLines::new(file);

	let hideout = "Celelelelstial";
	let mut num = 1;
	for line in rev_lines {
		println!("{num} {:?}", line);


		num = num + 1;
		if num >= 1000 {
			println!("Stop searching after {num} lines");
			break;
		}

		let txt: String = match line {
			Ok(line) => String::from(line),
			Err(_) => {
				return "ERROR".to_string();
			}
		};

		if let Some(found) = txt.find(prefix) {
				println!("Found at idx {found}");
				let start = found + prefix.len();
				let slice = &txt[start..];
				let mut s = slice.to_string().trim();
				return format!("{slice}");
		}
		else {
			println!("Not found in {txt}");
			continue
		}
	}


	/*
	///const start = "2023/09/26 16:17:54 914733390 cffb0719 [INFO Client 7804] : You have entered ".len();
  for line in rev_lines {
    let lineStr = line.to_string();
		if let Some(found) = lineStr.find(prefix) {
				println!("IDNEXOF {found}");
		}
		else {
			println!(found);
			continue
		}
		if found != None {
			hideout = lineStr[found..lineStr.len()];
			break
		}
    if count > 1000 {
      break;
    }
  } */

	format!("{hideout}")
}


fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            recent_zone,
            remind,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
