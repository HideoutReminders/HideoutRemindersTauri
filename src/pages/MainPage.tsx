import CreateReminder from "../components/CreateReminder";
import {useAppStore} from "../lib/store";
import Card from "../components/Card";
import RemindersList from "../components/RemindersList";

export default function MainPage () {
	const {reminders} = useAppStore()
	return <>
		<Card>
			<CreateReminder />
		</Card>
		<div className={'p-4'}>
			<h2 className={'text-lg mb-2'}>Reminders</h2>
			<RemindersList reminders={reminders} />
		</div>
	</>
}
