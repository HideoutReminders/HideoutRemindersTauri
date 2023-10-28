import * as chrono from 'chrono-node'
import {Reminder, Settings} from "../types/types";
import {ensureJSONFile, readJSON, REMINDERS_FILE, saveJSON} from "./files";
import {isPoEStatusPausing, PoEStatus} from "./poe";

let idCount = 0
export function promptToReminder (prompt: string) : Reminder {
	const parsed = chrono.parse(prompt, new Date(), {
		forwardDate: true,
	})
	let date : Date
	let textWithoutDate : string
	if (!parsed.length) {
		throw new Error(`Couldn't find a time. Try adding "in 10m" or "Tuesday at 1pm".`)
	}
	else {
		const first = parsed[0]
		date = first.date()

		let text = prompt.replace(first.text, '').trim()

		// This part here removes the "in" from a reminder when you say "take out the trash in 10m"
		// Also check for "Put the laundry in in 10m"
		// "Put the laundry in 5pm"
		// "Put the laundry in Sep 3rd noon"
		const parts = text.split(/\s/g)
		if (parts.length >= 2) {
			if (parts[parts.length-1].toLowerCase() === 'in') {
				// This match is so we only catch "thing in 5m" and no "put laundry in 5pm"
				const matches = first.text.match(/[0-9]+\s?(m|minute|minutes|h|hour|hours|s|second|seconds)/)
				if (!!matches) {
					text = text.substring(0, text.length-3)
				}
			}
		}
		textWithoutDate = text
	}

	if (date < new Date()) {
		throw new Error(`Cannot remind in the past: ${date.toISOString()}`)
	}

	if (!textWithoutDate) {
		throw new Error(`All date, no reminder`)
	}

	idCount++
	const r : Reminder = {
		id: Date.now() + '_' + idCount,
		text: textWithoutDate,
		playAfter: date,
		playedAt: null,
		createdAt: new Date(),
	}

	return r
}


export type ReminderStatus = 'upcoming' |
	'queued' | // It needs to play but another one is currently playing
	'playing' |
	'done'
export function getReminderStatus (r: Reminder, playingId: string | null, poeStatus: null | PoEStatus, settings: Settings) : ReminderStatus {
	if (playingId && playingId === r.id) {
		return 'playing'
	}
	if (r.playedAt) {
		return 'done'
	}
	if (r.playAfter > new Date()) {
		return 'upcoming'
	}
	if (playingId) {
		return 'queued'
	}
	const pausing = isPoEStatusPausing(poeStatus, settings)
	return pausing ? 'queued' : 'upcoming'
}

export async function ensureRemindersJSONFile () {
	await ensureJSONFile<Reminder[]>(REMINDERS_FILE, [])
}

export async function getReminders () : Promise<Reminder[]> {
	await ensureRemindersJSONFile();
	const rows = await readJSON<Reminder[]>(REMINDERS_FILE, [])
	return rows.map((r: any) : Reminder => {
		return {
			id: r.id,
			playedAt: r.playedAt ? new Date(r.playedAt) : null,
			playAfter: new Date(r.playAfter),
			text: r.text,
			createdAt: new Date(r.createdAt)
		}
	})
}

export async function saveRemindersJSONFile (reminders: Reminder[]) : Promise<Reminder[]> {
	await ensureRemindersJSONFile()
	const sorted = reminders.sort((a, b) => {
		if (a.playedAt && b.playedAt) {
			return a.playedAt > b.playedAt ? -1 : 1
		}
		if (a.playedAt && !b.playedAt) {
			return 1
		}
		if (!a.playedAt && b.playedAt) {
			return -1
		}
		return a.playAfter < b.playAfter ? -1 : 1
	})

	await saveJSON(REMINDERS_FILE, sorted)
	return sorted
}
