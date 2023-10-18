import {Reminder} from "../types/types";
import ReminderListItem from "./ReminderListItem";
import Card from "./Card";

export default function RemindersList ({reminders}: {reminders: Reminder[]}) {
	return <>
		{reminders.length === 0 && <Card className={'text-center py-8'}>No upcoming reminders.</Card>}
		{reminders.length > 0 && <div className={'p-4'}>{reminders.map((r) => {
			return <ReminderListItem reminder={r} key={r.id} />
		})}</div>}
	</>
}
