import {useEffect} from "react";
import {AppDatabase, DB_KEY_REMINDERS, DB_KEY_SETTINGS, defaultSettings, useAppStore} from "../lib/store";
import {Reminder, Settings} from "../types/types";
import App from "../App";

export default function useLoadApp () {
	const {
		loading,
		setLoading,
		addError,
		setSettings,
		setReminders,
	} = useAppStore()
	useEffect(() => {
		AppDatabase.keys().then((keys) => {
			console.log('keys', keys)
		})

		Promise.all([
			AppDatabase.get<Settings>(DB_KEY_SETTINGS).then((s) => {
				console.log('settings from our storage', s)
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
					console.log('set that!')
					setSettings(s)
					return 'loaded settings from db'
				}
				else {
					console.log('just use the default')
					setSettings(defaultSettings())
					return 'default settings'
				}
			}),
			AppDatabase.get<any[]>(DB_KEY_REMINDERS).then((rs) => {
				console.log('reminders get rs', rs)
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
			console.log('results', results)
			setTimeout(() => {
				setLoading(false)
			}, 250)
		})


	}, [])

	return {
		loading,
	}
}
