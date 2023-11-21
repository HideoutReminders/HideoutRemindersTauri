import "./styles.css";
import MainPage from "./pages/MainPage";
import SettingsPage from "./pages/SettingsPage";
import {AppError, PageKey, useAppStore} from './lib/store'
import SVGIcon from "./components/SVGIcon";
import useUpdatePoEStatus from "./hooks/use-update-poe-status";
import PoEStatus from "./components/PoEStatus";
import {ReactNode, useEffect} from "react";
import usePlayTTS from "./hooks/use-play-tts";
import SettingsIcon from '@mui/icons-material/Settings';

import {isPoEStatusPausing} from "./lib/poe";
import PaidVersionPage from "./pages/PaidVersionPage";

function App () {
	const store = useAppStore()
	const {
		errors,
		page,
		removeError,
		addError,
		loading,
		playingId,
		saveReminder,
		openReminderId,
		closeReminder,
		settings,
		get,
	} = store
	useUpdatePoEStatus()
	const play = usePlayTTS()

	useEffect(() => {
		// TODO: Detect dev mode here, and only disable right click when non in dev mode
		if (false) {
			document.addEventListener('contextmenu', event => event.preventDefault());
		}
	}, [])

	useEffect(() => {
		if (!settings.safeZoneNames || !settings.safeZoneNames.length) {
			addError({
				key: 'no_safe_zones',
				message: 'You have no safe zones in your settings',
				type: 'known',
				context: 'general',
			})
		}
		else {
			removeError('no_safe_zones')
		}
	}, [(settings.safeZoneNames||'').length])

	useEffect(() => {
		if (loading) {
			return
		}

		let running = true
		let timeout : NodeJS.Timeout

		function repeat () {
			if (!running) {
				return
			}

			clearTimeout(timeout)
			timeout = setTimeout(playReminders, 1000)
		}

		function playReminders () {
			const {reminders, poeStatus, settings} = get()
			const paused = isPoEStatusPausing(poeStatus, settings)

			if (paused) {
				repeat()
				return
			}

			const now = new Date()
			const nextToPlay = reminders.find((r) => {
				if (r.playedAt) {
					return false
				}
				if (r.playAfter > now) {
					return false
				}

				return r.id !== playingId
			})

			if (!nextToPlay) {
				repeat()
				return
			}

			const playedAt = new Date()

			// Check how long ago this reminder should have played. If it's more than a few seconds,
			// it means we're only playing it now cause they moved into a safe zone. If that's the case
			// we add a few seconds of delay to account for the loading screen
			const diff = playedAt.getTime() - nextToPlay.playAfter.getTime()
			const loadingScreenTime = 3000
			const shouldHavePlayedBuffer = 5000
			const delay = diff >= shouldHavePlayedBuffer ? loadingScreenTime : 0

			setTimeout(() => {
				console.log('next to play', nextToPlay.id, nextToPlay.playedAt, nextToPlay.text)
				play.playReminder(nextToPlay, settings).then(() => {
				})
				if (openReminderId === nextToPlay.id) {
					closeReminder()
				}
				saveReminder(nextToPlay.id, {
					playedAt,
				}).then(() => {
				}).catch((err) => {
					// If there was an error saving it, we revert it to unplayed
					saveReminder(nextToPlay.id, {
						playedAt: null
					})
					addError({
						context: 'reminders_play',
						error: err,
						type: 'unknown'
					})
				}).finally(() => {
					console.log('don playing, check the next in 10s')
					repeat()
				})
			}, delay)
		}

		playReminders()

		return () => {
			clearInterval(timeout)
			running = false
		}
	}, [loading])

	if (loading) {
		return <div>
			<div className="flex justify-center items-center w-screen h-screen">
				<div role="status">
					<SVGIcon type={'spinner'} />
					<span className="sr-only">Loading...</span>
				</div>
			</div>
		</div>
	}

	return <>
		<div id={'header'} className={'sticky top-0 z-50 flex w-full bg-slate-900 drop-shadow-lg justify-between'}>
			<PoEStatus />
			<ul className={'flex-0 menu menu-horizontal items-center'}>
				<NavItem
					label={'Reminders'}
					page={'main'}
				/>
				<NavItem label={'Upgrade'} page={'paid-version'} />
				<NavItem
					label={<SettingsIcon />}
					page={'settings'}
				/>
			</ul>
		</div>
		<div id={'content'} className={''}>{/*TODO: Make this the only vertical scroll that we have somehow. I think we remove the sticky from header?*/}
			<div className={'relative flex-1 p-4 pb-0 ' + (errors.length === 0 ? 'hidden' : 'block')}>
				{errors.map((e: AppError) => {
					let label = ''
					let canDelete = true
					if (e.context === 'poe_status') {
						label = 'PoE Client Txt'
						canDelete = false
					}

					return <div className="alert alert-error gap-2" key={e.key}>
						<SVGIcon type={'error'} />
						<div>
							{label && <><strong>{label}:</strong>{" "}</>}
							<span>{e.message || 'Unknown error occurred'}</span>
						</div>
						{canDelete && <button type={'button'} onClick={() => {
							removeError(e.key)
						}}>
							X
						</button>}
					</div>
				})}
			</div>
			{page === 'main' && <MainPage />}
			{page === 'settings' && <SettingsPage />}
			{page === 'paid-version' && <PaidVersionPage />}
		</div>
	</>
}

function NavItem (props: {label: ReactNode, page: PageKey}) {
	const {page, setPage} = useAppStore()
	const active = props.page === page
	const activeClasses = 'active'
	const inactiveClasses = ''

	return <li>
		<a
			href={'#' + props.page}
			onClick={() => setPage(props.page)}
			className={'text-lg me-2 rounded ' + (active ? activeClasses : inactiveClasses)}
		>
			{props.label}
		</a>
	</li>
}

export default App;
