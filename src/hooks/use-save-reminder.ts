import {Reminder} from "../types/types";
import {useAppStore} from "../lib/store";
import {saveRemindersJSONFile} from "../lib/reminders";

export function useSaveReminder () {
	const {reminders, setReminders, addError} = useAppStore()
	async function updateReminder (reminderId: string, updates: Partial<Reminder>) {
		const updatedReminders : Reminder[] = [
			...reminders,
		].map((r) => {
			if (r.id !== reminderId) {
				return r
			}
			return {
				...r,
				...updates
			}
		})

		try {
			const sorted = await saveRemindersJSONFile(updatedReminders)
			setReminders(sorted)
		}
		catch (ex) {
			addError({
				context: 'reminders_edit',
				key: 'save_json',
				message: ex,
			})
		}
	}

	async function deleteReminder (reminderId: string) {
		const updatedReminders : Reminder[] = [
			...reminders,
		].filter(x => x.id !== reminderId)

		try {
			const sorted = await saveRemindersJSONFile(updatedReminders)
			setReminders(sorted)
		}
		catch (ex) {
			addError({
				context: 'reminders_delete',
				key: 'save_json',
				message: ex,
			})
		}
	}

	return {
		updateReminder,
		deleteReminder,
	}
}
