import "./styles.css";
import {useEffect, useState} from "react";
import MainPage from "./pages/MainPage";
import SettingsPage from "./pages/SettingsPage";
import {useAppStore, AppStorage} from './lib/store'
import {Reminder, Settings} from "./types/types";
import {defaultSettings} from "./lib/state";
import {getPoEClientStatus, PoEStatus} from "./lib/poe";
import {formatDateTime} from "./lib/helpers";

function App () {
	const {setReminders, setSettings, settings, errors, addError} = useAppStore()
	const [poeStatus, setPoEStatus] = useState<PoEStatus | null>()
	const [page, setPage] = useState<'main' | 'setup' | 'settings'>('main')

	useEffect(() => {
		AppStorage.get<Settings>('settings').then((s) => {
			console.log('s', s)
			if (s && s.hasOwnProperty('volume')) {
				setSettings(s)
			}
			else {
				setSettings(defaultSettings())
			}
		})
		AppStorage.get<Reminder[]>('reminders').then((rs) => {
			if (rs) {
				setReminders(rs)
			}
		})
	}, [])

	useEffect(() => {
		let interval = setInterval(() => {
			if (!settings.clientTxt) {
				console.log('DO SOMETHIGN ABOUT BLANK')
				return
			}
			getPoEClientStatus(settings.clientTxt).then((stat) => {
				console.log('stat', stat)
				setPoEStatus(stat)
			}).catch((err) => {
				addError({
					context: 'poe_status',
					key: 'poe_status',
					message: err.toString(),
				})
			})
		}, 1000)

		return () => {
			clearInterval(interval)
		}
	}, [settings.clientTxt])

	return <div>
		<ul className={'menu menu-horizontal bg-base-200 w-full mb-2 shadow-lg'}>
			<li className={'me-2 ' + (page === 'main' ? 'active' : '')}><a href={'#main'} onClick={() => setPage('main')}>Home</a></li>
			<li className={'me-2 ' + (page === 'settings' ? 'active' : '')}><a href={'#settings'} onClick={() => setPage('settings')}>Settings</a></li>
		</ul>
		{errors.map((e) => {
			return <div className="alert alert-error" key={e.key}>
				<svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none"
						 viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
								d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<span>{e.message}</span>
			</div>
		})}
		{poeStatus && <div>
			<div>Client Read {formatDateTime(poeStatus.mostRecentLineAt)}</div>
			<div>You joined {poeStatus.zoneName} {formatDateTime(poeStatus.zoneChangedAt)}</div>
			<div className={'alert alert-info'}>{JSON.stringify(poeStatus)}</div>
		</div>}
		{page === 'main' && <MainPage />}
		{page === 'settings' && <SettingsPage />}
	</div>
}

export default App;
