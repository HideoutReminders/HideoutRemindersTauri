import {useEffect, useState} from "react";
import {getRandom} from "../lib/helpers";
import {promptToReminder, saveRemindersJSONFile} from "../lib/reminders";
import {useAppStore} from "../lib/store";

const placeholders = [
	'do the dishes in 10 minutes',
	'thursday at 5pm to touch grass',
	'walk the dog at 3',
	'stretch in an hour',
	'sep 3rd 1pm check your /passives',
	'8:59am go to your stand-up',
]

export default function CreateReminder () {
	const {setReminders, reminders, addError, clearContextErrors} = useAppStore()
	const [placeholder, setPlaceholder] = useState(getRandom<string>(placeholders))
	const [text, setText] = useState('')

	useEffect(() => {
		let interval = setInterval(() => {
			setPlaceholder(getRandom<string>(placeholders))
		}, 5000)

		return () => {
			clearInterval(interval)
		}
	}, [])

	async function submit (e: React.FormEvent) {
		e.preventDefault()
		if (!text) {
			return
		}
		if (!text.trim()) {
			return
		}
		try {
			const r = promptToReminder(text)
			const updated = [
				r,
				...reminders,
			]
			saveRemindersJSONFile(updated).catch((err) => {
				addError({
					context: 'reminders_add',
					key: 'save_json',
					message: err.toString(),
				})
			}).then((sorted) => {
				setText('')
				clearContextErrors('reminders_add')
				setReminders(sorted)
			})
		}
		catch (ex) {
			addError({
				context: 'reminders_add',
				message: `${ex}`
			})
			throw ex
		}
	}

	return <>
		<form className={'form-inline'} onSubmit={submit}>
			<div className={'join flex'}>
				<input
					value={text}
					onChange={(e) => {
						setText(e.target.value)
					}}
					type={'text'}
					className={'join-item input placeholder-gray-500 focus:placeholder-gray-700 focus:outline-none input-bordered border-sm flex-1'}
					placeholder={placeholder}
				/>
				<button type={'submit'} className={'join-item btn btn-primary no-animation'}>Add Reminder</button>
			</div>
		</form>
	</>
}
