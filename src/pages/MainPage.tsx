import {Reminder} from "../types/types";
import CreateReminder from "../components/CreateReminder";
import {formatDateTime} from "../lib/helpers";
import {useAppStore} from "../lib/store";

export default function MainPage () {
	const {reminders} = useAppStore()
	return <div className={'p-4'}>
		<div>
			<CreateReminder />
			<div>
				Your PoE Info should go here
			</div>
		</div>
		<div>
			<h2>Upcoming</h2>
			{reminders.map((r: Reminder) => {
				return <div key={r.id}>{r.text} @ {formatDateTime(r.playAfter)}</div>
			})}
		</div>
	</div>
}
