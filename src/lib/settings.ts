import {ensureJSONFile, readJSON, saveJSON, SETTINGS_FILE} from "./files";
import {Settings} from "../types/types";
import {defaultSettings} from "./store";

export async function ensureSettingsJSONFile () {
	await ensureJSONFile<Settings>(SETTINGS_FILE, defaultSettings())
}

export async function getSettings () : Promise<Settings> {
	await ensureSettingsJSONFile();
	return readJSON<Settings>(SETTINGS_FILE, defaultSettings())
}

export async function saveSettingsJSONFile (set: Settings) {
	await ensureSettingsJSONFile()
	await saveJSON(SETTINGS_FILE, set)
}
