import {Reminder} from "../types/types";
import {ReactNode, useEffect, useRef, useState} from "react";
import {useAppStore} from "../lib/store";
import {getReminderStatus, promptToReminder} from "../lib/reminders";
import {formatDateTime} from "../lib/helpers";
import TimeAgo from "./TimeAgo";
import usePlayTTS from "../hooks/use-play-tts";
import {confirm} from '@tauri-apps/api/dialog';
import {Simulate} from "react-dom/test-utils";
import play = Simulate.play;

type Props = {
	reminder: Reminder
	showPastHeader: boolean
}

// These are classesto put in on a text input so it looks just like text until you click on it
// and then it's clear you can type
const maskInputClasses = 'rounded bg-transparent py-1 px-2 border border-transparent bg-transparent focus:outline-none focus:border-slate-400 focus:bg-slate-900 transition-all '

export default function ReminderListItem ({reminder, showPastHeader}: Props) {
	const {addError, openReminder, openReminderId, closeReminder, playingId, settings, saveReminder, deleteReminder, poeStatus} = useAppStore()
	const [text, setText] = useState(reminder.text)
	const [playAfter, setPlayAfter] = useState(formatDateTime(reminder.playAfter))
	const [saved, setSaved] = useState(false)
	const hiddenDateRef = useRef<HTMLSpanElement>(null)
	const {playReminder} = usePlayTTS()
	const isOpen = openReminderId === reminder.id

	useEffect(() => {
		setText(text)
	}, [reminder.text])

	useEffect(() => {
		setPlayAfter(formatDateTime(reminder.playAfter))
	}, [reminder.playAfter])

	const classes = ['reminder']

	async function _save (updated: Partial<Reminder>) {
		await saveReminder(reminder.id, updated)
		setSaved(true)
		// @ts-ignore
		document.activeElement?.blur()
		setTimeout(() => {
			setSaved(false)
		}, 1500)
	}

	async function submitText (e: React.FormEvent) {
		e.preventDefault()
		if (!text || !text.trim()) {
			return
		}
		_save({
			text,
		})
	}

	function submitDate (e: React.FormEvent) {
		e.preventDefault()
		const date = getPlayAfterFromDuration(text)
		if (!date) {
			return
		}
		_save({
			playAfter: date,
		})
	}

	function getPlayAfterFromDuration (duration: string) {
		let prompted : Reminder
		try {
			prompted = promptToReminder(duration + ' ' + playAfter)
			return prompted.playAfter
		}
		catch (e) {
			addError({
				context: 'reminders_edit',
				error: e,
				type: 'unknown'
			})
			return null
		}
	}

	function postpone (duration: string) {
		const playAfter = getPlayAfterFromDuration(duration)
		if (!playAfter) {
			return
		}
		_save({
			playedAt: null,
			playAfter: playAfter,
		})
	}

	function add (duration: string) {
		const playAfter = getPlayAfterFromDuration(duration)
		if (!playAfter) {
			return
		}
		const diff = playAfter.getTime() - Date.now()
		const current = reminder.playAfter.getTime()
		const newDate = new Date(current + diff)
		_save({
			playAfter: newDate,
		})
	}

	async function clickPlayPreview () {
		playReminder(reminder, settings)
	}

	async function clickDelete () {
		const dewit = await confirm('Delete reminder?')
		if (!dewit) {
			return
		}
		await deleteReminder(reminder.id)
	}

	let status = getReminderStatus(reminder, playingId, poeStatus, settings)
	//status = 'playing'
	let statusLine : ReactNode
	const disableEditing = status === 'done' || status === 'playing'

	if (status === 'upcoming') {
		// This content goes into a span that is hidden from view, but its width is used to set the container
		// that also has the text input. This is so we can set the input width to 100%, which is how we achieve a length
		// of input that matches the length of the content
		// This substring/max/min stuff here is so that if you're editing the date and you erase the content, there's
		// a minimum width
		const minLenStr = formatDateTime(reminder.playAfter)
		let stretchSpanContent = (playAfter + minLenStr).substring(0, Math.max(playAfter.length, minLenStr.length))
		stretchSpanContent = playAfter.length > minLenStr.length ? playAfter : minLenStr
		//stretchSpanContent = stretchSpanContent.split('').map(x => 'e').join('') // Uniform size by replacing all text with e

		statusLine = <form onSubmit={submitDate} className={'inline flex items-center relative transition-all'}>
			<input
				disabled={disableEditing}
				value={playAfter}
				className={maskInputClasses + ' w-full z-50 absolute transition-all'}
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
			<span ref={hiddenDateRef} className={'relative z-1 opacity-0 py-1 px-2 border border-transparent'}>
				{stretchSpanContent}&nbsp;&nbsp;&nbsp;
			</span>
		</form>
	}
	else if (status === 'playing') {
		statusLine = <div className={'ms-2'}>Playing</div>
		classes.push('playing')
	}
	else if (status === 'queued') {
		statusLine = <div className={'ms-2'}>Queued since {formatDateTime(reminder.playAfter)}</div>
	}
	else if (status === 'done') {
		const playedAgo = Date.now() - reminder.playedAt?.getTime()
		const showPostpone = playedAgo < (1000 * 60 * 5) // Only show this button if the reminder was played in the last X minutes
		statusLine = <div className={'ms-2'}>
			Played <TimeAgo date={reminder.playedAt as Date} />
			{showPostpone && !isOpen && <button className={'btn btn-xs btn-neutral hover:btn-primary  ms-2'} type={'button'} onClick={() => postpone('10m')}>Postpone 10m</button>}
		</div>
		classes.push('played opacity-70')
	}

	classes.push('mb-4 collapse collapse-arrow border border-base-300 bg-base-200 relative')
	classes.push(isOpen ? 'collapse-open' : 'collapse-close')

	return <div className={'reminder-container'} data-show-past={showPastHeader}>
		<div className={'transition-all mb-2 relative overflow-hidden'} style={{height: showPastHeader ? '3rem' : '0px'}}>
			<div
				className={'divider m-0 absolute w-full h-6 flex items-center content-center text-gray-500 transition-all opacity-' + (showPastHeader ? 100 : 0)}
				style={{
					left: '50%',
					top: '50%',
					transform: 'translate(-50%, -50%)',
				}}
			>
				past reminders
			</div>
		</div>
		<div className={classes.join(' ')}>
			<div className={'voice-bar'}>
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
				<div className={'bar'} />
			</div>
			<div className={'collapse-title relative z-10'}>
				<div>
					<form onSubmit={submitText} className={'pe-2'}>
							<input
								disabled={disableEditing}
								value={text}
								className={maskInputClasses + ' text-bold text-xl w-full text-ellipsis'}
								type={'text'}
								onChange={(e) => {
									setText(e.target.value)
								}}
								onBlur={(e) => {
									if (!e.target.value || !e.target.value.trim()) {
										setText(reminder.text)
									}
								}}
							/>
					</form>
				</div>
				<div className={'flex items-center text-sm h-8'}>
					{statusLine}
					<span className={'ms-2 transition-all ' + (saved ? 'text-success' : 'text-transparent click-through')}>Saved!</span>
				</div>
			</div>
			<div className={'collapse-content flex justify-between items-center z-10 text-xs'}>
				<div className={'flex-column items-center pl-2'}>
					<button className={'btn btn-xs btn-neutral hover:btn-primary me-2'} onClick={() => clickPlayPreview()}>Preview</button>
					{reminder.playedAt && <div className={'join me-2'}>
						<button className={'btn btn-xs btn-neutral hover:btn-primary join-item'} onClick={() => postpone('5m')}>Postpone 5m</button>
						<button className={'btn btn-xs btn-neutral hover:btn-primary join-item'} onClick={() => postpone('10m')}>10m</button>
						<button className={'btn btn-xs btn-neutral hover:btn-primary join-item'} onClick={() => postpone('30m')}>30m</button>
						<button className={'btn btn-xs btn-neutral hover:btn-primary join-item'} onClick={() => postpone('1h')}>1h</button>
					</div>}
					{!reminder.playedAt && <div className={'join me-2'}>
						<button className={'btn btn-xs btn-neutral hover:btn-primary join-item'} onClick={() => add('5m')}>Add 5m</button>
						<button className={'btn btn-xs btn-neutral hover:btn-primary join-item'} onClick={() => add('10m')}>10m</button>
						<button className={'btn btn-xs btn-neutral hover:btn-primary join-item'} onClick={() => add('30m')}>30m</button>
						<button className={'btn btn-xs btn-neutral hover:btn-primary join-item'} onClick={() => add('1h')}>1h</button>
					</div>}
					<button className={'btn btn-error btn-xs'} onClick={() => clickDelete()}>Delete</button>
				</div>
				<div className={'pr-12'}>
					{reminder.playedAt && <><br />Played {formatDateTime(reminder.playedAt)},{" "}</>}
					Created {formatDateTime(reminder.createdAt)}
				</div>
			</div>
			{/*{position: "absolute", zIndex: 10, right: 0, top: 0, width: '50px', height: '100%', background: 'rgba(0, 0, 0, 0.25)'}*/}
			<button className={`btn-reminder-collapse focus:outline-none absolute z-10 right-0 w-12 top-0 h-full`} onClick={() => {
				isOpen ? closeReminder() : openReminder(reminder.id)
			}}>
			</button>
		</div>
	</div>
}
