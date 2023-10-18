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
export const SETTINGS_FILE : FileName = 'settings.json'

const FILE_OPTS = {
	dir: BaseDirectory.AppData,
}

async function ensureDataDir () {
	await createDir('', { dir: BaseDirectory.AppData, recursive: true });
}

export async function ensureJSONFile<T>(file: FileName, defaultData: T) {
	console.log('try to ensure', file)
	await ensureDataDir()
	const alreadyThere = await exists(file, FILE_OPTS)
	console.log('already', alreadyThere)
	if (!alreadyThere) {
		console.log('try to add it!')
		await saveJSON<T>(file, defaultData)
		console.log('saved success to', file)
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
// If you try to write just "h" to a file, and that file has "world" in it, the file will end up with "horld".
export async function saveJSON<T> (file: FileName, data: T)  {
	const alreadyThere = await exists(file, FILE_OPTS)
	console.log('alreadyThere', alreadyThere)
	const fileNameToWriteTo = alreadyThere ? '_' + file : file
	console.log('fileNameToWriteTo', fileNameToWriteTo)

	await writeTextFile({
		path: fileNameToWriteTo,
		contents: JSON.stringify(data),
	}, FILE_OPTS);

	if (alreadyThere) {
		console.log('remove old')
		await removeFile(file, FILE_OPTS)

		// Then rename the copy to the real name
		console.log('rename', fileNameToWriteTo, 'to', file)
		await renameFile(fileNameToWriteTo, file, FILE_OPTS)
	}
}
