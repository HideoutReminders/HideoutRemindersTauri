import "./styles.css";
import MainPage from "./pages/MainPage";
import SettingsPage from "./pages/SettingsPage";
import {AppError, defaultSettings, PageKey, useAppStore} from './lib/store'
import SVGIcon from "./components/SVGIcon";
import useUpdatePoEStatus from "./hooks/use-update-poe-status";
import PoEStatus from "./components/PoEStatus";
import {useEffect} from "react";
import {getSettings} from "./lib/settings";
import {getReminders} from "./lib/reminders";
import {Reminder} from "./types/types";
import {Simulate} from "react-dom/test-utils";
import usePlayTTS from "./hooks/use-play-tts";
import {useSaveReminder} from "./hooks/use-save-reminder";

function App () {
	const {
		errors,
		page,
		removeError,
		addError,
		setSettings,
		setReminders,
		setLoading,
		reminders,
		loading,
		playingId,
	} = useAppStore()
	useUpdatePoEStatus()
	const play = usePlayTTS()
	const {updateReminder} = useSaveReminder()

	useEffect(() => {
		if (!loading) {
			return
		}
		console.log('reminders have changed! there are now', reminders.length)
	}, [loading, reminders])

	useEffect(() => {
		Promise.all([
			getSettings().then((s) => {
				if (s && s.default) {
					addError({
						key: 'settings_defaults',
						context: 'general',
						message: 'Why come defaults are saved in our db',
					})
					return 'whyy is default saved'
				}
				// @ts-ignore
				if (s && s.value && typeof s.value === 'number') {
					addError({
						context: 'general',
						message: 'wtf is this settings thing'
					})
					return 'got that old one'
				}
				if (s && s.hasOwnProperty('volume')) {
					setSettings(s)
					return 'loaded settings from db'
				}
				else {
					setSettings(defaultSettings())
					return 'default settings'
				}
			}),
			getReminders().then((rs) => {
				console.log('reminders from db', rs)
				if (rs) {
					// TODO: Probably make a reminderFromDatabase mapping function
					setReminders(rs.map((r: any) : Reminder => {
						return {
							id: r.id,
							playedAt: r.playedAt ? new Date(r.playedAt) : null,
							playAfter: new Date(r.playAfter),
							text: r.text,
							createdAt: new Date(r.createdAt)
						}
					}))
					return 'loaded reminders'
				}

				return 'blank reminders from db'
			})
		]).then((results) => {
			console.log('results from loading', results)
			setTimeout(() => {
				setLoading(false)
			}, 250)
		})

		return () => {
			console.warn('unmounted for some reason')
		}
	}, [])

	useEffect(() => {
		function playReminders () {
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
				return
			}

			const playedAt = new Date()
			play.playReminder(nextToPlay).then(() => {
				updateReminder(nextToPlay.id, {
					playedAt,
				}).then(() => {
					console.log('played tts and saved it')
				})
			})
		}

		const interval = setInterval(playReminders, 1000)

		return () => {
			clearInterval(interval)
		}
	}, [reminders, playingId])

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
			<ul className={'flex-0 menu menu-horizontal'}>
				<NavItem
					label={'Reminders'}
					page={'main'}
				/>
				<NavItem
					label={'Settings'}
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
		</div>
	</>
}

function NavItem (props: {label: string, page: PageKey}) {
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
