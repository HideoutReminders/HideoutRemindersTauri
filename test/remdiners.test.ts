import {test, expect} from "vitest";
import {promptToReminder} from "../src/lib/reminders";
import {Reminder} from "../src/types/types";

type PromptTest = {
	prompt: string
	error?: string
	reminder?: {
		text: string
		playAfter: Date
	}
}


function mFromNow (minutes: number) {
	const now = Date.now()
	return new Date(now + (minutes * 1000 * 60))
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
		error: 'No parsed date found',
	},
	{
		prompt: 'put the laundry in in an hour',
		reminder: {
			text: 'put the laundry in',
			playAfter: mFromNow(60),
		},
	},
]

for (let i = 0; i < tests.length; i++) {
	const t = tests[i]
	test('prompt:' + t.prompt, () => {
		let r : Reminder
		try {
			r = promptToReminder(t.prompt)
		}
		catch (ex) {
			if (!t.error) {
				throw new Error(`Did not expect an error but got ${ex}`)
			}
			expect(ex.toString()).contain(t.error)
			return
		}
		if (t.error) {
			console.log('Reminder', r)
			throw new Error(`Expected error "${t.error}" but got none`)
		}
		expect(r.text).eq(t.reminder.text)
		console.log(`Expected ${t.reminder.playAfter.toISOString()} but got ${r.playAfter.toISOString()}`)
		expect(r.playAfter.toLocaleTimeString()).eq(t.reminder.playAfter.toLocaleTimeString())
	})
}
