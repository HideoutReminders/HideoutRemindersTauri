import {useEffect, useState} from "react";
import {getRandom} from "../lib/helpers";
import {promptToReminder} from "../lib/reminders";
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
	const {addReminder} = useAppStore()
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
			console.log('no text')
			return
		}
		if (!text.trim()) {
			console.log('no trim')
			return
		}
		try {
			const r = promptToReminder(text)
			console.log('adding ', r)
			addReminder(r)
			setText('')
		}
		catch (ex) {
			console.error(ex)
			throw ex
		}
	}

	return <div>
		<form className={'form-inline'} onSubmit={submit}>
			<div className={'form-group flex-grow'}>
				<input
					value={text}
					onChange={(e) => {
						setText(e.target.value)
					}}
					type={'text'}
					className={'input input-rounded border-sm'}
					placeholder={placeholder}
				/>
			</div>
			<div className={'form-group buttons ps-1'}>
				<button type={'submit'} className={'btn btn-primary'}>Add</button>
			</div>
		</form>
	</div>
}
