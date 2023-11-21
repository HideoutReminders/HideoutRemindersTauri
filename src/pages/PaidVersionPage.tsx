export default function PaidVersionPage () {
	const mailto = 'mailto:iwant@hideoutreminders.com?subject=Paid+Version+Mailing+List&body=I+would+like+to+be+notified+when+the+paid+version+is+ready'

	const features = [
		['Max Upcoming Reminders', 10, 'Unlimited'],
		['Create reminders in game', false, true],
		['Archive old reminders', false, true],
		['Say "toucan" in your reminders', false, true],
		['Themes', 1, 'More than 1'],
	]

	return <div className={'p-4 relative'}>
		<h2>Features!</h2>
		<div className={'grid grid-cols-2'}>
			<div>
				<h2 className={'text-xl text-secondary'}>Demo Version</h2>
				<ul className={'list-disc list-inside ps-0'}>
					<li>Max 10 pending reminders</li>
					<li>Cannot repeat stuff</li>
					<li>Can only delete old reminders</li>
					<li>Can't say "toucan"</li>
				</ul>
			</div>
			<div>
				<h2 className={'text-xl text-secondary'}>Paid Version</h2>
				<ul className={'list-disc list-inside ps-0'}>
					<li>Reminders that repeat</li>
					<li>Create reminders via PoE chat</li>
					<li>Unlimited reminders</li>
					<li>Can archive old reminders</li>
					<li>Can say "toucan"</li>
				</ul>
			</div>
		</div>

		Just <a href={mailto}>send me an email</a> letting me know you're interested. I'll reply when the paid version is ready.

		<a href={mailto} className={'text-xl btn btn-primary'}>Get Notified</a>
		<br />You will be emailed when it launches.
	</div>
}
