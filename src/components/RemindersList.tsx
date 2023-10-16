import {Reminder} from "../types/types";
import ReminderListItem from "./ReminderListItem";

export default function RemindersList ({reminders}: {reminders: Reminder[]}) {
	return <>
		{reminders.length === 0 && <div>No upcoming reminders.</div>}
		{reminders.map((r) => {
			return <ReminderListItem reminder={r} key={r.id} />
		})}
	</>
}
