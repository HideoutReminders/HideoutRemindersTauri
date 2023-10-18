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
		<RemindersList reminders={reminders} />
	</>
}
