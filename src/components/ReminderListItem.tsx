import {Reminder} from "../types/types";
import {ReactNode, useEffect, useRef, useState} from "react";
import {useAppStore} from "../lib/store";
import {getReminderStatus, promptToReminder} from "../lib/reminders";
import {formatDateTime} from "../lib/helpers";
import TimeAgo from "./TimeAgo";
import usePlayTTS from "../hooks/use-play-tts";
import {useSaveReminder} from "../hooks/use-save-reminder";
import { confirm } from '@tauri-apps/api/dialog';
import {Simulate} from "react-dom/test-utils";
import play = Simulate.play;

type Props = {
	reminder: Reminder
}

// These are classesto put in on a text input so it looks just like text until you click on it
// and then it's clear you can type
const maskInputClasses = 'rounded bg-transparent py-1 px-2 border border-transparent bg-transparent focus:outline-none focus:border-slate-400 focus:bg-slate-900 transition-all '

export default function ReminderListItem ({reminder}: Props) {
	const {addError, playingId} = useAppStore()
	const [open, setOpen] = useState(false)
	const [text, setText] = useState(reminder.text)
	const [playAfter, setPlayAfter] = useState(formatDateTime(reminder.playAfter))
	const [saved, setSaved] = useState(false)
	const hiddenDateRef = useRef<HTMLSpanElement>()
	const {playReminder} = usePlayTTS()
	const {updateReminder, deleteReminder} = useSaveReminder()

	useEffect(() => {
		setText(text)
	}, [reminder.text])

	useEffect(() => {
		setPlayAfter(formatDateTime(reminder.playAfter))
	}, [reminder.playAfter])

	const classes = ['reminder']

	async function _save (updated: Partial<Reminder>) {
		await updateReminder(reminder.id, updated)
		setSaved(true)
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
		let prompted : Reminder
		try {
			prompted = promptToReminder(text + ' ' + playAfter)
		}
		catch (e) {
			addError({
				context: 'reminders_edit',
				message: e.toString(),
			})
			return
		}

		_save({
			playAfter: prompted.playAfter,
		})
	}


	async function clickPlayPreview () {
		playReminder(reminder)
	}

	async function clickDelete () {
		const dewit = await confirm('Delete reminder?')
		if (!dewit) {
			return
		}
		await deleteReminder(reminder.id)
	}

	let status = getReminderStatus(reminder)
	let statusLine : ReactNode

	if (status === 'upcoming') {
		// This content goes into a span that is hidden from view, but its width is used to set the container
		// that also has the text input. This is so we can set the input width to 100%, which is how we achieve a length
		// of input that matches the length of the content
		// This substring/max/min stuff here is so that if you're editing the date and you erase the content, there's
		// a minimum width
		const minLenStr = formatDateTime(reminder.playAfter)
		let stretchSpanContent = (playAfter + minLenStr).substring(0, Math.max(playAfter.length, minLenStr.length))
		stretchSpanContent = playAfter.length > minLenStr ? playAfter : minLenStr
		//stretchSpanContent = stretchSpanContent.split('').map(x => 'e').join('') // Uniform size by replacing all text with e

		statusLine = <form onSubmit={submitDate} className={'inline flex items-center relative transition-all'}>
			<input
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
		statusLine = <div className={'ms-2'}>Played <TimeAgo date={reminder.playedAt as Date} /></div>
		classes.push('played opacity-70')
	}

	classes.push('mb-4 collapse collapse-arrow border border-base-300 bg-base-200 relative')
	classes.push(open ? 'collapse-open' : 'collapse-close')

	if (playingId === reminder.id) {
		classes.push('playing')
	}

	return <div className={classes.join(' ')}>
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
							value={text}
							className={maskInputClasses + ' text-bold text-xl w-full text-ellipsis hover:bg-gray-900'}
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
			<div className={'flex items-center text-sm'}>
				{statusLine}
				<span className={'ms-2 transition-all ' + (saved ? 'text-success' : 'text-transparent click-through')}>Saved!</span>
			</div>
		</div>
		<div className={'collapse-content flex justify-between items-center z-10 text-xs'}>
			<div className={'flex-column items-center pl-2'}>
				<button className={'btn btn-xs btn-neutral me-2'} onClick={() => clickPlayPreview()}>Preview</button>
				<button className={'btn btn-xs btn-neutral me-2'} onClick={() => clickPlayPreview()}>Clone</button>
				<button className={'btn btn-xs btn-neutral me-2'} onClick={() => clickPlayPreview()}>Repeat</button>
				{/*<button className={'btn btn-xs btn-accent me-2'} onClick={() => clickPlayPreview()}>Clone</button>*/}
				<button className={'btn btn-error btn-xs'} onClick={() => clickDelete()}>Delete</button>
			</div>
			<div className={'pr-12'}>
				{reminder.playedAt && <><br />Played {formatDateTime(reminder.playedAt)},{" "}</>}
				Created {formatDateTime(reminder.createdAt)}
			</div>
		</div>
		{/*{position: "absolute", zIndex: 10, right: 0, top: 0, width: '50px', height: '100%', background: 'rgba(0, 0, 0, 0.25)'}*/}
		<button className={`btn-reminder-collapse focus:outline-none absolute z-10 right-0 w-12 top-0 h-full`} onClick={() => {
			setOpen(!open)
		}}>
		</button>
	</div>
}
