import {
	BaseDirectory,
	createDir,
	exists,
	readTextFile,
	removeFile,
	renameFile,
	writeTextFile
} from "@tauri-apps/api/fs";

type FileName = 'reminders.json' | 'settings.json'

export const REMINDERS_FILE : FileName = 'reminders.json'

const FILE_OPTS = {
	dir: BaseDirectory.AppData,
}

async function ensureDataDir () {
	await createDir('', { dir: BaseDirectory.AppData, recursive: true });
}

export async function ensureJSONFile<T>(file: FileName, defaultData: T) {
	await ensureDataDir()
	const alreadyThere = await exists(file, FILE_OPTS)
	if (!alreadyThere) {
		await saveJSON<T>(file, defaultData)
	}
}

export async function readJSON<T> (file: FileName, defaultData: T) : Promise<T> {
	await ensureJSONFile(file, defaultData)
	const txt = await readTextFile(file, FILE_OPTS)
	const d = JSON.parse(txt) as unknown as T
	return d
}


// Tauri's write doesnt replace ALL the content of the file, so I do some weird stuff
// with overwriting
// If you write "h" to a file with "world" in it, the file will have "horld".
export async function saveJSON<T> (file: FileName, data: T)  {
	// I write a copy first
	await writeTextFile({
		path: '_' + file,
		contents: JSON.stringify(data),
	}, FILE_OPTS);

	// Then delete the old one
	await removeFile(file, FILE_OPTS)

	// Then rename the copy to the real name
	await renameFile('_' + file, file, FILE_OPTS)
}
