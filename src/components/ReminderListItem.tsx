import {Reminder} from "../types/types";
import {ReactNode, useEffect, useRef, useState} from "react";
import {useAppStore} from "../lib/store";
import {getReminderStatus, promptToReminder} from "../lib/reminders";
import {formatDateTime} from "../lib/helpers";
import TimeAgo from "./TimeAgo";

type Props = {
	reminder: Reminder
}

// These are classesto put in on a text input so it looks just like text until you click on it
// and then it's clear you can type
const maskInputClasses = 'rounded bg-transparent py-1 px-2 -ml-2 border border-transparent bg-transparent focus:outline-none focus:border-slate-400 focus:bg-slate-900 transition-all '

export default function ReminderListItem ({reminder}: Props) {
	const {saveReminder, addError} = useAppStore()
	const [text, setText] = useState(reminder.text)
	const [playAfter, setPlayAfter] = useState(formatDateTime(reminder.playAfter))
	const savedRef = useRef<HTMLSpanElement>()
	const [saved, setSaved] = useState(false)
	const hiddenDateRef = useRef<HTMLSpanElement>()

	useEffect(() => {
		setText(text)
	}, [reminder.text])

	useEffect(() => {
		setPlayAfter(formatDateTime(reminder.playAfter))
	}, [reminder.playAfter])

	const classes = ['reminder']

	function submitText (e: React.FormEvent) {
		e.preventDefault()
		_saveReminder({
			...reminder,
			text,
		})
	}

	function submitDate (e: React.FormEvent) {
		e.preventDefault()
		try {
			const prompted = promptToReminder(text + ' ' + playAfter)
			_saveReminder({
				...reminder,
				playAfter: prompted.playAfter,
			})
		}
		catch (e) {
			addError({
				context: 'reminders_edit',
				message: e.toString(),
			})
		}
	}

	function _saveReminder (updated: Reminder) {
		saveReminder(updated)
		setSaved(true)
		// @ts-ignore
		document.activeElement.blur()
		setTimeout(() => {
			setSaved(false)
		}, 500)
	}

	const status = getReminderStatus(reminder)
	let statusLine : ReactNode

	if (status === 'upcoming') {
		statusLine = <form onSubmit={submitDate} className={'inline flex items-center relative'}>
			<input
				value={playAfter}
				className={maskInputClasses + ' z-50 absolute w-full'}
				size={0}
				type={'text'}
				onFocus={() => {
					hiddenDateRef.current?.classList.add('ml-2')
				}}
				onBlur={() => {
					hiddenDateRef.current?.classList.remove('ml-2')
				}}
				onChange={(e) => {
					setPlayAfter(e.target.value)
				}}
			/>
			<span ref={hiddenDateRef} className={'relative z-1 opacity-0 py-1 px-2 -ml-2'}>{playAfter}</span>
		</form>
	}
	else if (status === 'playing') {
		statusLine = <>Playing</>
	}
	else if (status === 'queued') {
		statusLine = <>Queued</>
	}
	else if (status === 'done') {
		statusLine = <>Played <TimeAgo date={reminder.playedAt} /></>
		classes.push('played')
	}

	classes.push('mb-4 border-b-2 pb-4')

	return <div className={classes.join(' ')}>
		<div>
			<form onSubmit={submitText}>
				<input
					value={text}
					className={maskInputClasses + ' text-bold text-xl'}
					type={'text'}
					onChange={(e) => {
						setText(e.target.value)
					}}
				/>
		</form>
		</div>
		<div className={'flex items-center text-sm'}>
			{statusLine}
			<span ref={savedRef} className={'ms-2 transition-all ' + (saved ? 'text-success' : 'text-transparent click-through')}>Saved!</span>
		</div>
	</div>
}
