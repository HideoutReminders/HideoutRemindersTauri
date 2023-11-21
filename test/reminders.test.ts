import {test, expect} from "vitest";
import {promptToReminder} from "../src/lib/reminders";
import {Reminder} from "../src/types/types";

type PromptTest = {
	prompt: string
	error?: string
	only?: boolean
	now?: Date
	reminder?: {
		text: string
		playAfter: Date
	}
}


function mFromNow (minutes: number) {
	return mFromDate(minutes, new Date())
}

function mFromDate (minutes: number, date: Date) {
	return new Date(date.getTime() + (minutes * 1000 * 60))
}

const tests : PromptTest[] = [
	{
		prompt: 'do the dishes in 10m',
		reminder: {
			text: 'do the dishes',
			playAfter: mFromNow(10),
		}
	},
	{
		prompt: 'do the dishes',
		error: `Couldn't find a time`,
	},
	{
		prompt: 'put the laundry in in an hour',
		reminder: {
			text: 'put the laundry in',
			playAfter: mFromNow(60),
		},
	},
]


for (let i = 0; i <= 14; i++) {
	const date = new Date('2023-10-01T' + (i < 10 ? `0${i}`: i) + ':00:00')
	let playAfter

	// after 10am and before 10pm
	if (i >= 10 && i < 20) {
		playAfter = new Date('2023-10-01T22:00:00') // 10pm
	}
	// It is 10pm and after
	else if (i >= 20) {
		playAfter = new Date('2023-10-02T10:00:00') // 10am next day
	}
	// Before 10am
	else {
		playAfter = new Date('2023-10-01T10:00:00') // 10am
	}

	tests.push({
		prompt: `call your friend at 10`,
		now: date,
		reminder: {
			playAfter,
			text: 'call your friend',
		}
	})

	const newPlayAfter = new Date(playAfter)
	newPlayAfter.setMinutes(25)
	tests.push({
		prompt: `call your friend at 10:25`,
		now: date,
		reminder: {
			playAfter: newPlayAfter,
			text: 'call your friend',
		}
	})
}

for (let i = 5; i <= 12; i++) {
	const date = new Date('2023-08-01T' + (i < 10 ? `0${i}`: i) + ':00:00')

	tests.push({
		prompt: `go outside today at 10`,
		now: date,
		reminder: {
			playAfter: new Date('2023-08-01T22:00:00'),
			text: 'go outside',
		}
	})
}


for (let i = 0; i <= 23; i++) {
	const date = new Date('2023-07-31T' + (i < 10 ? `0${i}`: i) + ':00:00')

	tests.push({
		prompt: `today at 11:55 pm shovel the driveway`,
		now: date,
		reminder: {
			playAfter: new Date('2023-07-31T23:55:00'),
			text: 'shovel the driveway',
		}
	})
}


for (let i = 0; i <= 23; i++) {
	const date = new Date('2023-07-31T' + (i < 10 ? `0${i}`: i) + ':00:00')

	tests.push({
		prompt: `tomorrow 9am do something nice for someone cool`,
		now: date,
		reminder: {
			playAfter: new Date('2023-08-01T09:00:00'),
			text: 'do something nice for someone cool',
		}
	})
	tests.push({
		prompt: `tomorrow at 9 in the morning do something nice for someone cool`,
		now: date,
		reminder: {
			playAfter: new Date('2023-08-01T09:00:00'),
			text: 'do something nice for someone cool',
		}
	})
}


//tests[tests.length-12].only = true
//tests[28].only = true

const hasOnly = tests.some(x => x.only)

for (let i = 0; i < tests.length; i++) {
	(function () {
		const t = tests[i]
		if (hasOnly && !t.only) {
			return
		}
		const fn = t.only ? test.only : test
		fn('[' + i + '] prompt is "' + t.prompt + '"' + (t.now ? (` when it's ${t.now.toLocaleString()}`) : ''), () => {
			let r: Reminder
			try {
				r = promptToReminder(t.prompt, t.now)
			} catch (ex) {
				if (!t.error) {
					throw new Error(`Did not expect an error but got ${ex}`)
				}
				console.log('error', ex)
				expect(ex.toString()).contain(t.error)
				return
			}
			if (t.error) {
				console.log('Reminder', r)
				throw new Error(`Expected error "${t.error}" but got none`)
			}
			expect(r.text).eq(t.reminder.text)
			const diff = r.playAfter.getTime() - t.reminder.playAfter.getTime()
			if (diff > 1000) {
				throw new Error(`Date is off by over 1s. Expected ${t.reminder.playAfter.toLocaleString()} but got ${r.playAfter.toLocaleString()}`)
			}
		})
	}())
}
