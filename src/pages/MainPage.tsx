import CreateReminder from "../components/CreateReminder";
import {useAppStore} from "../lib/store";
import Card from "../components/Card";
import {confirm} from "@tauri-apps/api/dialog";
import ReminderListItem from "../components/ReminderListItem";

export default function MainPage () {
	const {computed, reminders, playingId, deleteReminders} = useAppStore()
	const played = reminders.filter(x => !!x.playedAt)
	const toPurge = played.filter(x => x.playedAt! < new Date(Date.now() - 60000))


	async function clickDeleteReminders () {
		const dewit = await confirm('Delete ' + toPurge.length + ' reminder' + (toPurge.length === 1 ? '' : 's') + '?')
		if (!dewit) {
			return
		}
		deleteReminders(toPurge.map(x => x.id))
	}


	let pastHeaderShown = false

	const sorted = computed.sortedReminders()

	return <>
		<Card className={'mb-0'}>
			<CreateReminder />
		</Card>
		{sorted.length === 0 && <Card className={'text-center py-8'}>No reminders.</Card>}
		{sorted.length > 0 && <div className={'p-4'}>
				{sorted.map((r) => {
					let showPastHeader = false
					if (r.playedAt && r.id !== playingId) {
						showPastHeader = !pastHeaderShown
						pastHeaderShown = true
					}
					const item = <ReminderListItem key={r.id} reminder={r} showPastHeader={showPastHeader} />
					return item
				})}
		</div>}
		{toPurge.length > 1 && <div className={'p-4 pb-8 text-center'}>
			<button type={'button'} onClick={() => clickDeleteReminders()} className={'btn btn-sm btn-outline btn-error opacity-70 hover:opacity-100'}>
				Delete {toPurge.length} Old{toPurge.length < played.length ? 'est' : ''} Reminders
			</button>
		</div>}
	</>
}
