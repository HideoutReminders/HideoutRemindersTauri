import {create} from 'zustand'
import {Reminder, Settings} from "../types/types";
import {getPoEClientStatus, POE_CLIENT_TXT_DIRS, POE_SAFE_ZONES, PoEStatus} from "./poe";
import {getReminders, saveRemindersJSONFile} from "./reminders";
import {getSettings, saveSettingsJSONFile} from "./settings";

export function defaultSettings () : Settings {
	return {
		volume: 100,
		ttsVoiceIdx: 0,
		ttsVoiceRandom: true,
		poeClientTxtPath: '',
		lastSavedAt: null,
		default: true,
		safeZoneNames: POE_SAFE_ZONES,
	}
}

export function defaultState () : AppState {
	return {
		loading: true,
		settings: defaultSettings(),
		errors: [],
		reminders: [],
		page: 'main',
		poeStatus: null,
		playingId: null,
		playing: false,
		openReminderId: null,
		computed: {
			sortedReminders: () => []
		}
	}
}

export type ErrorContext = 'reminders_add' | 'reminders_edit' | 'reminders_delete' | 'reminders_play' | 'settings_save' | 'poe_status' | 'general'

export type ErrorDef = {
	type: 'known'
	key?: string
	context: ErrorContext
	message: string
} | {
	type: 'unknown'
	context: ErrorContext
	error: any
}

export type AppError = {
	key: string
	context: ErrorContext
	message: string
}

export type PageKey = 'main' | 'settings'

export interface AppState {
	page: PageKey
	loading: boolean
	settings: Settings
	reminders: Reminder[]
	errors: AppError[],
	poeStatus: null | PoEStatus
	openReminderId: null | string
	playing: boolean
	playingId: null | string
	computed: {
		sortedReminders: () => Reminder[]
	}
}

type Setters = {
	closeReminder: () => void
	openReminder: (rid: string) => void
	saveSettings: (s: Settings) => void
	addReminder: (r: Reminder) => Promise<void>
	deleteReminder: (rid: string) => Promise<void>
	deleteReminders: (rids: string[]) => Promise<void>
	saveReminder: (id: string, updates: Partial<Reminder>) => Promise<void>
	setPoEStatus: (p: null | PoEStatus) => void
	addError: (e: ErrorDef) => void
	removeError: (key: string) => void
	clearContextErrors: (e: ErrorContext) => void
	setLoading: (l: boolean) => void
	setPage: (p: PageKey) => void
	setPlaying: (rid?: string) => void
	clearPlaying: () => void
}

type ZustandStore = AppState & Setters & {
	get: () => AppState
}

type ZustandSetPlaceHolderType = any

export const useAppStore = create<ZustandStore>()((set: ZustandSetPlaceHolderType, get) => {
	async function loadReminders () {
		return getReminders().then((r) => {
			set(() => ({
				reminders: r,
			}))
		})
	}

	/**
	 * When you first load the app, this will search for the most recently edited Client.txt file
	 * that we can find, and save your settings with that path
	 */
	async function findClientTxt () {
		type Result = {
			date: Date,
			path: string
		}

		const results = await Promise.all<Result | null>(POE_CLIENT_TXT_DIRS.map((dir: string) : Promise<Result | null> => {
			const path = dir + '\\Client.txt'
			console.log('path', path)
			return new Promise((res) => {
				getPoEClientStatus(path).then((status) => {
					console.log(path, 'status', status)
					res({
						date: status.mostRecentLineAt,
						path,
					})
				}).catch(() => {
					res(null)
				})
			})
		}))
		console.log('results', results)
		// @ts-ignore
		const found : Result[] = results.filter(x => !!x)
		if (found.length === 0) {
			return
		}
		const sorts = found.sort((a, b) => {
			return a.date > b.date ? -1 : 1;
		})
		const settings = get().settings
		saveSettings({
			...settings,
			poeClientTxtPath: sorts[0].path,
		})
	}

	async function loadSettings () {
		return getSettings().then((s) => {
			// This is here to account for the JSON
			s.lastSavedAt = s.lastSavedAt ? new Date(s.lastSavedAt.toString()) : new Date()
			set(() => ({
				settings: s,
			}))

				findClientTxt()
			if (s.default && !s.poeClientTxtPath) {
			}
		})
	}
	Promise.all([loadReminders(), loadSettings()]).then(() => {
		set(() => ({
			loading: false,
		}))
	})

	async function saveReminders (r: Reminder[]) {
		const sorted = r.sort((a, b) => {
			return a.playAfter < b.playAfter ? -1 : 1
		})
		set(() => ({
			reminders: sorted,
		}))
		await saveRemindersJSONFile(sorted)
	}

	async function saveSettings (s: Settings) {
		set(() => ({
			settings: s
		}))
		return saveSettingsJSONFile(s)
	}

	async function saveReminder (id: string, updates: Partial<Reminder>) {
		const newReminders = get().reminders.map((r) => {
			if (r.id !== id) {
				return r
			}
			return {
				...r,
				...updates,
			}
		})
		return saveReminders(newReminders)
	}

	async function deleteReminders (ids: string[]) {
		const newReminders = get().reminders.filter(x => !ids.includes(x.id))
		return saveReminders(newReminders)
	}

	async function deleteReminder (id: string) {
		const newReminders = get().reminders.filter(x => x.id !== id)
		return saveReminders(newReminders)
	}

	async function addReminder (r: Reminder) {
		const reminders = get().reminders
		return saveReminders([
			r,
			...reminders
		])
	}

	const state : ZustandStore = {
		...defaultState(),
		setPlaying: (rid?: string) => set(() : Partial<AppState> => ({
			playing: true,
			playingId: rid || null,
		})),
		clearPlaying: () => set(() => ({
			playing: false,
			playingId: null,
		})),
		setPage: (p: PageKey) => set(() => ({
			page: p,
		})),
		setLoading: (l: boolean) => set(() => ({
			loading: l,
		})),
		saveSettings,
		saveReminder,
		addReminder,
		deleteReminder,
		deleteReminders,
		openReminder: (rid: string) => set(() => ({
			openReminderId: rid,
		})),
		closeReminder: () => set(() => ({
			openReminderId: null,
		})),
		setPoEStatus: (p: null | PoEStatus) => set(() => ({
			poeStatus: p ? {
				...p,
			} : null,
		})),
		addError: (def: ErrorDef) => set((state: AppState) => {
			let err : AppError
			if (def.type === 'known') {
				err = {
					message: def.message,
					key: def.key || '',
					context: def.context,
				}
			}
			else {
				err = {
					message: def.error.toString(),
					key: '',
					context: def.context
				}
			}
			err.key = err.key  || 'auto_' + Date.now() + '_' + state.errors.length

			if (err.message.indexOf('Error: ') === 0) {
				err.message = err.message.substring('Error: '.length)
			}

			for (let i = 0; i < state.errors.length; i++) {
				const se = state.errors[i]
				if (se.key && se.key === err.key) {
					const newErrors = state.errors
					newErrors[i] = err
					return {
						errors: [
							...newErrors
						]
					}
				}
			}

			return {
				errors: [
					err,
					...state.errors,
				]
			}
		}),
		removeError: (k: string) => set((state: AppState) => ({
			errors: state.errors.filter((x: AppError) => x.key !== k)
		})),
		clearContextErrors: (ctx: ErrorContext) => set((state: AppState) => {
			return {
				errors: state.errors.filter((x: AppError) => x.context !== ctx)
			}
		}),
		get,
		computed: {
			sortedReminders: () => {
				const {reminders, playingId} = get()
				const sorted = reminders.sort((a, b) => {
					const aPlaying = a.id === playingId
					const bPlaying = b.id === playingId

					if (aPlaying) {
						if (a.playedAt) {
							return -1
						}
					}

					if (bPlaying) {
						if (b.playedAt) {
							return 1
						}
					}

					if (a.playedAt && b.playedAt) {
						return a.playedAt > b.playedAt ? -1 : 1
					}
					if (a.playedAt && !b.playedAt) {
						return 1
					}
					if (!a.playedAt && b.playedAt) {
						return -1
					}
					return a.playAfter < b.playAfter ? -1 : 1
				})
				return sorted
			}
		}
	}
	return state
})
