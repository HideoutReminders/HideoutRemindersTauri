import {Reminder} from "../types/types";
import CreateReminder from "../components/CreateReminder";
import {formatDateTime} from "../lib/helpers";
import {useAppContext} from "../lib/state";

export default function MainPage () {
	const {state} = useAppContext()

	return <div>
		<div>
			<CreateReminder />
			<div>
				Your should go here
			</div>
		</div>
		<div>
			<h2>Upcoming</h2>
			{state.reminders.map((r: Reminder) => {
				return <div key={r.id}>{r.text} @ {formatDateTime(r.playAfter)}</div>
			})}
		</div>
	</div>
}
