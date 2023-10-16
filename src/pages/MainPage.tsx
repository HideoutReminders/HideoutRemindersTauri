import {Reminder} from "../types/types";
import CreateReminder from "../components/CreateReminder";
import {formatDateTime} from "../lib/helpers";
import {useAppStore} from "../lib/store";
import Card from "../components/Card";

export default function MainPage () {
	const {reminders} = useAppStore()
	return <>
		<Card>
			<CreateReminder />
		</Card>
		<Card>
			<h2 className={'text-lg mb-2'}>Upcoming</h2>
			{reminders.length === 0 && <div>No upcoming reminders.</div>}
			{reminders.map((r: Reminder) => {
				return <div key={r.id}>{r.text} @ {formatDateTime(r.playAfter)}</div>
			})}
		</Card>
	</>
}
