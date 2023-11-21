import * as chronoBase from 'chrono-node'
import {Reminder, Settings} from "../types/types";
import {ensureJSONFile, readJSON, REMINDERS_FILE, saveJSON} from "./files";
import {isPoEStatusPausing, PoEStatus} from "./poe";

const chrono = chronoBase.casual.clone();
chrono.refiners.push({
	// Sometimes this library fails to do proper AM/PM handling
	// So you put "do a thing at 10" when it is 8am and it'll make the date be 10am tomorrow instead of 10pm tonight
	// The following refine fixes that issue
	refine: (context, results) => {
		const regEx = /at [0-9][0-9]?(\:[0-9][0-9]?)?/i

		// All the code in this refine kinda sucks, so I'm leaving function here for you to quickly
		// toggle logging on and off
		// This will likely become necessary as more tests are added to reminders.test.ts
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		function log (..._args: any[]) {
			//console.log.apply(null, arguments)
		}

		if (!context.text.match(regEx)) {
			return results
		}

		results = results.map((res) => {
			const {start} = res
			const lower = res.text.toLowerCase()
			if (!lower.match(regEx)) {
				return res
			}

			const numbers = res.text.split(/[^0-9\\:]+/i)
			log('numbers', numbers)
			const parts = numbers.join('').split(':')
			log('parts', parts)
			let hour = parseInt(parts[0])
			const minute = parts.length > 1 ? parseInt(parts[1]): 0

			const {
				impliedValues: implied,
				knownValues: known,
			} = start
			log('res text', res.text)
			log('implied', implied)
			log('knwnw', known)
			const year = known.year || implied.year
			const month = known.month || implied.month
			const day = known.day || implied.day
			log('year', year)
			log('month', month)
			log('day', day)
			log('now', context.refDate)
			log('minute', minute)
			log('hour', hour)
			const isNowAM = context.refDate.getHours() <= 11
			const assumed = new Date(year, month-1, day, hour, minute, 0)
			const diff = assumed.getTime() - context.refDate.getTime()
			const diffHours = diff / 1000 / 60 / 60

			log('diffHours', diffHours)
			log('assumed to start', assumed)
			log('start.knownValues', start.knownValues)
			log('implied', implied)

			if (diffHours > 24) {
				log('go back one day but forward 12 hours')
				assumed.setDate(assumed.getDate()-1)
				assumed.setHours(assumed.getHours()+12)
			}
			else if (assumed < context.refDate) {
				log('just add 12 hours? I dunno about this one')
				assumed.setHours(assumed.getHours()+12)
			}
			else if (diffHours > 12 && !isNowAM && assumed.getHours() > 12) {
				log('diff is over 12 but it is not the morning')
				assumed.setDate(assumed.getDate()-1)
				assumed.setHours(assumed.getHours()+12)
			}
			else if (diffHours >= 12 && diffHours <= 24) {
				assumed.setDate(assumed.getDate()-1)
				assumed.setHours(assumed.getHours()+12)
			}
			else {
				log('OH NO, just whatever return it I dunno')
				return res
			}

			res.start.knownValues.second = assumed.getSeconds()
			res.start.knownValues.minute = assumed.getMinutes()
			res.start.knownValues.hour = assumed.getHours()
			res.start.knownValues.day = assumed.getDate()
			res.start.knownValues.month = assumed.getMonth()+1
			res.start.knownValues.year = assumed.getFullYear()
			res.start.impliedValues = {}

			log('return this', res.start, res.impliedValues)

			return res
		})

		return results;
	}
});

let idCount = 0
export function promptToReminder (prompt: string, now = new Date()) : Reminder {
	const parsed = chrono.parse(prompt, now, {
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

	if (date < now) {
		throw new Error(`Cannot remind in the past: ${date} is before ${now}`)
	}

	if (!textWithoutDate) {
		throw new Error(`All date, no reminder`)
	}

	idCount++
	const r : Reminder = {
		id: now.getTime() + '_' + idCount,
		text: textWithoutDate,
		playAfter: date,
		playedAt: null,
		createdAt: now,
		parsed,
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
