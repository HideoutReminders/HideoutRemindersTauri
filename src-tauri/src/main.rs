// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::File;
use std::env;
use rev_lines::RevLines;
use serde::Serialize;
use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu, SystemTrayEvent, SystemTrayMenuItem, Manager};
use regex::Regex;

struct ClientTxtLine {
	date_time: String,
	msg: String,
}

#[derive(Serialize)]
struct PoEClientStatus {
	zone_name: String,
	afk: bool,
	afk_at: String,
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

const DATE_LEN : usize = "2023/10/14 03:08:35".len();
const AFK_ON : &str = ": AFK mode is now ON";
const AFK_OFF : &str = ": AFK mode is now OF";
const AFK_LEN : usize = AFK_ON.len();
const ZONE_CHANGE_PREFIX : &str = ": You have entered ";
const ZONE_CHANGE_PREFIX_LEN : usize = ZONE_CHANGE_PREFIX.len();

// The number of characters that exist AFTER the date and before a "You have entered XXX." message

fn get_poe_status(client_txt_path: &str) -> Result<PoEClientStatus, String> {


	if client_txt_path == "" {
		return Err("Client.txt path is blank".to_string());
	}

	let file = match File::open(client_txt_path) {
        Err(why) => return Err(format!("Could not open file: {}", why)),
        Ok(file) => file,
    };

	let rev_lines = RevLines::new(file);

	let mut num = 1; // Count so we don't loop for too long
	let mut poe_status = PoEClientStatus {
		zone_changed_at: String::from(""),
		zone_name: String::from(""),
		afk: false,
		afk_at: String::from(""),
		most_recent_line_at: String::from(""),
		success: true,
		reminder_at: String::from(""),
		reminder_prompt: String::from(""),
	};

	let mut afk_set = false;

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
				return Err(ex.to_string());
			}
		};

		// Skip blank lines
		if txt.len() == 0 {
			continue
		}

		// Every line in the Client.txt starts with a date, so if the line is too short this probably
		// not a Client.txt file
		if txt.len() < DATE_LEN {
			return Err("That doesn't look like a PoE client.txt file.".to_string());
		}

		println!("-------");
		println!("{}", txt);

		// We're reading in reverse order, so the first date we encounter will be the most recent date
		if poe_status.most_recent_line_at == "" {
			poe_status.most_recent_line_at = txt[0..DATE_LEN].to_string();
		}
		println!("most recent line {}", poe_status.most_recent_line_at);

		let parsed = match parse_line(&txt) {
			Ok(p) => p,
			Err(e) => {
				println!("Let's just skip this line cause of this err: {}", e);
				continue
			},
		};

		let msg_len = parsed.msg.len();
		println!("msg_len {msg_len}");
		if msg_len >= ZONE_CHANGE_PREFIX_LEN {
			let pref = &parsed.msg[0..ZONE_CHANGE_PREFIX_LEN];
			println!("prefix: {}", pref);
			if pref == ZONE_CHANGE_PREFIX {
				println!("This looks like a zone change thing!");
				let zone = &parsed.msg[ZONE_CHANGE_PREFIX_LEN..];
				println!("zone: {zone}");
				let slice = &zone[0..zone.len()-1]; // -1 gets rid of the period at the end of the line
				poe_status.zone_name = format!("{slice}");
				poe_status.zone_changed_at = parsed.date_time.to_string();
				break;
			}
		}

		// Update AFK if we have not already set AFK status and if this line is long enough
		if !afk_set && msg_len >= AFK_LEN {
			let pref = &parsed.msg[0..AFK_LEN];
			println!("afk prefix. Is \"{}\" == \"{}\"", pref, AFK_ON);
			if pref == AFK_ON {
				afk_set = true;
				poe_status.afk = true;
				poe_status.afk_at = parsed.date_time.to_string();
			}
			else if pref == AFK_OFF {
				afk_set = true;
				poe_status.afk = false;
                poe_status.afk_at = parsed.date_time.to_string();
				println!("AFK IS OFF");
			}
		}

		/*
		if let Some(found) = line_re.captures(txt) {
			// This will skip "] : You have entered" if someone is just messing with you by
			// sending you a PM with that text in it
			println!("DATE_LEN {DATE_LEN}, found: {found}, you_have_entered_pre_len {you_have_entered_pre_len}");
			if found > you_have_entered_pre_len {
				continue
			}
			let start = found + ZONE_CHANGE_PREFIX.len();
			let slice = &without_date[start..without_date.len()-1]; // -1 gets rid of the period at the end of the line
			poe_status.zone_name = format!("{slice}");
			poe_status.zone_changed_at = date;
			break;
		}
		else {
			//println!("No zone change found");
			// TODO: Look for a line saying you're AFK or not afk
			continue
		}
		*/
	}

	if num <= 1 {
			return Err("Could not find any lines in Client.txt".to_string());
	}

	if poe_status.most_recent_line_at == "" {
		return Err("Could not find any dates in Client.txt".to_string());
	}

	Ok(poe_status)
}

#[tauri::command]
fn poe_status(client_txt_path: &str) -> String {
	let status = match get_poe_status(client_txt_path) {
		Ok(s) => s,
		Err(e) => return format!("{}", error_res(e)),
	};

	let err = error_res(String::from("Could not serialize JSON"));
	let j = serde_json::to_string(&status).expect(&err);
	format!("{}", j)
}

#[derive(Clone, serde::Serialize)]
struct Payload {
  args: Vec<String>,
  cwd: String,
}

fn get_line_re() -> regex::Regex{
	let line_re = Regex::new(r"^([0-9]{4}\/[0-9]{2}\/[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}) [0-9]+ [a-z0-9A-Z]+ \[INFO Client [0-9]+\] (.+)").unwrap();
	return line_re;
}

fn parse_line(line: &str) -> Result<ClientTxtLine, String> {
	let re = get_line_re();
	let Some(caps) = re.captures(line) else {
		return Err("Line did not match RegExp".to_string());
	};

	Ok(ClientTxtLine {
		date_time: caps[1].to_string(),
		msg: caps[2].to_string(),
	})
}

fn main() {
	let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide");
    let tray_menu = SystemTrayMenu::new()
		.add_item(quit)
		.add_native_item(SystemTrayMenuItem::Separator)
		.add_item(hide);
	let system_tray = SystemTray::new()
		.with_menu(tray_menu);

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
        .system_tray(system_tray)
        .on_system_tray_event(|app, event| match event {
			SystemTrayEvent::LeftClick {
				position: _,
				size: _,
				..
			} => {
				let window = app.get_window("main").unwrap();
					window.show().unwrap();
				}
				SystemTrayEvent::MenuItemClick { id, .. } => {
				match id.as_str() {
					"quit" => {
						std::process::exit(0);
					}
					"hide" => {
						let window = app.get_window("main").unwrap();
						window.hide().unwrap();
					}
				    _ => {}
				}
			}
			_ => {}
            })
        // This code is from here: https://github.com/tauri-apps/plugins-workspace/tree/v1/plugins/single-instance#usage
		.plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            println!("{}, {argv:?}, {cwd}", app.package_info().name);

            app.emit_all("single-instance", Payload { args: argv, cwd }).unwrap();
        }))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;

	fn get_test_client_path(name: &str) -> String {
		let dir = match env::current_dir() {
			Ok(x) => x,
			Err(_) => panic!("this should not fail"),
        };

        return dir.display().to_string() + "\\test-clients\\Client." + name + ".txt";
	}

    #[test]
    fn test_error_res() -> Result<(), String> {
        assert_eq!(error_res(String::from("This is a sample test")), r#"{"success":false,"message":"This is a sample test"}"#);
        Ok(())
    }

    #[test]
    fn test_get_client_non_existant() -> Result<(), String> {
		match get_poe_status("/path/to/where/file/is/not/client.txt") {
			Ok(_) => panic!("Should not succeed"),
			Err(e) => assert_eq!(e.to_string(), "Could not open file: The system cannot find the path specified. (os error 3)"),
		};
		Ok(())
    }

    #[test]
    fn test_get_client_blank_path() -> Result<(), String> {
        match get_poe_status("") {
            Ok(_) => panic!("Should not succeed"),
            Err(e) => assert_eq!(e.to_string(), "Client.txt path is blank"),
        };
        Ok(())
    }

    #[test]
    fn test_get_status_empty() -> Result<(), String> {
        match get_poe_status(&get_test_client_path("empty")) {
            Ok(_) => panic!("Should not succeed"),
            Err(e) => assert_eq!(e.to_string(), "Could not find any lines in Client.txt"),
        };
        Ok(())
    }

    #[test]
    fn test_get_status_celestial_hideout() -> Result<(), String> {
        let path = &get_test_client_path("celestial-hideout");
        println!("Open {}", path);
        let status = match get_poe_status(path) {
            Ok(s) => s,
            Err(e) => panic!("Should not fail. Got this: {}", e),
        };

        assert_eq!(status.zone_name, "Celestial Hideout");
        assert_eq!(status.zone_changed_at, "2023/10/20 02:00:07");
        assert_eq!(status.most_recent_line_at, "2023/10/20 02:00:34");

        Ok(())
    }

	// This test is to ensure that checking client.txt doesn't pick up private
	// messages from other users
    #[test]
    fn test_get_status_malicious_text() -> Result<(), String> {
        let path = &get_test_client_path("malicious-text");
        println!("Open {}", path);
        let status = match get_poe_status(path) {
            Ok(s) => s,
            Err(e) => panic!("Should not fail. Got this: {}", e),
        };

		assert_ne!(status.zone_name, "Stupid Hideout");
        assert_eq!(status.zone_name, "Celestial Hideout");
        assert_eq!(status.zone_changed_at, "2023/10/20 02:00:07");
        assert_eq!(status.most_recent_line_at, "2023/10/21 02:00:06");

        Ok(())
    }


    #[test]
    fn test_get_status_celestial_afk() -> Result<(), String> {
        let path = &get_test_client_path("celestial-afk");
        println!("Open {}", path);
        let status = match get_poe_status(path) {
            Ok(s) => s,
            Err(e) => panic!("Should not fail. Got this: {}", e),
        };

        assert_eq!(status.zone_name, "Celestial Hideout");
        assert_eq!(status.zone_changed_at, "2023/10/20 02:00:07");
        assert_eq!(status.most_recent_line_at, "2023/10/20 13:02:36");

        assert_eq!(status.afk_at, "2023/10/20 12:39:39");
        assert_eq!(status.afk, true);

        Ok(())
    }


    #[test]
    fn test_get_status_celestial_afk_off() -> Result<(), String> {
        let path = &get_test_client_path("celestial-afk-off");
        println!("Open {}", path);
        let status = match get_poe_status(path) {
            Ok(s) => s,
            Err(e) => panic!("Should not fail. Got this: {}", e),
        };

        assert_eq!(status.zone_name, "Celestial Hideout");
        assert_eq!(status.zone_changed_at, "2023/10/20 02:00:07");
        assert_eq!(status.most_recent_line_at, "2023/10/20 14:36:58");

        assert_eq!(status.afk_at, "2023/10/20 13:21:06");
        assert_eq!(status.afk, false);

        Ok(())
    }

    #[test]
    fn test_regexp() -> Result<(), String> {
    	let line_re = get_line_re();
		let mut line1 = "2023/10/20 02:00:07 424105921 cffb0719 [INFO Client 25996] : You have entered Celestial Hideout.";
		let Some(caps) = line_re.captures(line1) else {
			panic!("Did not find a line");
		};
		assert_eq!(&caps[1], "2023/10/20 02:00:07");
		assert_eq!(&caps[2], ": You have entered Celestial Hideout.");

		line1 = "2023/10/20 02:00:07 42413205921 cffbsfasb0719 [INFO Client 2595353296] : AFK mode is now ON.";
		let Some(caps) = line_re.captures(line1) else {
			panic!("Did not find a line");
		};
		assert_eq!(&caps[1], "2023/10/20 02:00:07");
		assert_eq!(&caps[2], ": AFK mode is now ON.");

		line1 = "2019/10/20 02:00:11 1 ab [INFO Client 2] : AFK mode is now OFF.";
        let Some(caps) = line_re.captures(line1) else {
            panic!("Did not find a line");
        };
        assert_eq!(&caps[1], "2019/10/20 02:00:11");
        assert_eq!(&caps[2], ": AFK mode is now OFF.");

		Ok(())
    }

    #[test]
    fn test_parse_line() -> Result<(), String> {
	    let line1 = "2023/10/20 02:00:07 424105921 cffb0719 [INFO Client 25996] : You have entered Celestial Hideout.";
	    let parsed = match parse_line(line1) {
	        Ok(x) => x,
	        Err(e) => panic!("{}", e),
	    };
	    assert_eq!(parsed.date_time, "2023/10/20 02:00:07");
	    assert_eq!(parsed.msg, ": You have entered Celestial Hideout.");

	    let line1 = "2023/01/20 02:11:07 1 ab [INFO Client 1] @From Meanie: Hi, does this mess up your app? 2023/10/20 02:00:07 424105921 cffb0719 [INFO Client 25996] : You have entered Celestial Hideout.";
	    let parsed = match parse_line(line1) {
	        Ok(x) => x,
	        Err(e) => panic!("{}", e),
	    };
	    assert_eq!(parsed.date_time, "2023/01/20 02:11:07");
	    assert_eq!(parsed.msg, "@From Meanie: Hi, does this mess up your app? 2023/10/20 02:00:07 424105921 cffb0719 [INFO Client 25996] : You have entered Celestial Hideout.");

	    Ok(())
    }

    #[test]
    fn test_show_pwd() -> Result<(), String> {
        match env::current_dir() {
			Ok(dir) => println!("DIR: {}", dir.display()),
			Err(_) => panic!("this should not fail"),
        };
        Ok(())
    }
}
