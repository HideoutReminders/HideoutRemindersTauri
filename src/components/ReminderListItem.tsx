import {Reminder} from "../types/types";
import {ReactNode, useEffect, useRef, useState} from "react";
import {useAppStore} from "../lib/store";
import {getReminderStatus, promptToReminder} from "../lib/reminders";
import {formatDateTime} from "../lib/helpers";
import TimeAgo from "./TimeAgo";
import {PlayButton} from "../pages/SettingsPage";

type Props = {
	reminder: Reminder
}

// These are classesto put in on a text input so it looks just like text until you click on it
// and then it's clear you can type
const maskInputClasses = 'rounded bg-transparent py-1 px-2 border border-transparent bg-transparent focus:outline-none focus:border-slate-400 focus:bg-slate-900 transition-all '

export default function ReminderListItem ({reminder}: Props) {
	const {saveReminder, addError} = useAppStore()
	const [text, setText] = useState(reminder.text)
	const [playAfter, setPlayAfter] = useState(formatDateTime(reminder.playAfter))
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
		}, 1800)
	}

	const status = getReminderStatus(reminder)
	let statusLine : ReactNode

	if (status === 'upcoming') {
		// This content goes into a span that is hidden from view, but its width is used to set the container
		// that also has the text input. This is so we can set the input width to 100%, which is how we achieve a length
		// of input that matches the length of the content
		// This substring/max/min stuff here is so that if you're editing the date and you erase the content, there's
		// a minimum width
		const minLenStr = 'Today @ 10:00pm'
		let stretchSpanContent = (playAfter + minLenStr).substring(0, Math.max(playAfter.length, minLenStr.length))
		stretchSpanContent = stretchSpanContent.split('').map(x => 'e').join('') // Uniform size by replacing all text with e

		statusLine = <form onSubmit={submitDate} className={'inline flex items-center relative'}>
			<input
				value={playAfter}
				className={maskInputClasses + ' z-50 absolute w-full'}
				size={0}
				type={'text'}
				onFocus={() => {
					//hiddenDateRef.current?.classList.add('ml-2')
				}}
				onBlur={() => {
					//hiddenDateRef.current?.classList.remove('ml-2')
				}}
				onChange={(e) => {
					setPlayAfter(e.target.value)
				}}
			/>
			<span ref={hiddenDateRef} className={'relative z-1 opacity-0 py-1 px-2'}>
				{stretchSpanContent}
			</span>
		</form>
	}
	else if (status === 'playing') {
		statusLine = <>Playing</>
	}
	else if (status === 'queued') {
		statusLine = <>Queued</>
	}
	else if (status === 'done') {
		statusLine = <>Played <TimeAgo date={reminder.playedAt as Date} /></>
		classes.push('played')
	}

	classes.push('mb-4 bg-base-300 py-2 ps-2 pe-4 rounded-lg grid grid-cols-[1fr_min-content]')

	return <div className={classes.join(' ')}>
		<div>
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
				&bull;
				<span className={'ms-2 me-2'}>Once</span>
				&bull;
				<PlayButton onClick={() => {}} className={'border-none'} />
				<span className={'ms-2 transition-all ' + (saved ? 'text-success' : 'text-transparent click-through')}>Saved!</span>
			</div>
		</div>
		<div className={'flex items-center'}>
			<button type={'button'}>X</button>
		</div>
	</div>
}
