import {useEffect, useState} from "react";
import {getRandom} from "../lib/helpers";
import {promptToReminder} from "../lib/reminders";
import {useAppContext} from "../lib/state";

const placeholders = [
	'do the dishes in 10 minutes',
	'thursday at 5pm to touch grass',
	'walk the dog at 3',
	'stretch in an hour',
	'sep 3rd 1pm check your /passives',
	'8:59am go to your stand-up',
]

export default function CreateReminder () {
	const {dispatch} = useAppContext()
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
			dispatch({
				type: 'ADD_REMINDER',
				payload: r,
			})
		}
		catch (ex) {
			dispatch({
				type: 'SET_ERROR',
				payload: {
					context: 'reminders_add',
					message: ex.toString()
				},
			})
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
					className={'form-control form-control-reminder'}
					placeholder={placeholder}
				/>
			</div>
			<div className={'form-group buttons ps-1'}>
				<button type={'submit'} className={'btn btn-primary'}>Add</button>
			</div>
		</form>
	</div>
}
