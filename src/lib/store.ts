import {create} from 'zustand'
import {Reminder, Settings} from "../types/types";
import {Store} from "tauri-plugin-store-api";
import {PoEStatus} from "./poe";

export const DB_KEY_SETTINGS = 'settings'
export const DB_KEY_REMINDERS = 'reminders'

export function defaultSettings () : Settings {
	return {
		volume: 100,
		ttsVoice: 0,
		ttsVoiceRandom: true,
		poeClientTxtPath: '',
		lastSavedAt: null,
		default: true,
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
	}
}

export type ErrorContext = 'reminders_add' | 'reminders_edit' | 'settings_save' | 'poe_status' | 'general'

export type ErrorDef = {
	key?: string
	context: ErrorContext
	message: string
}

export type AppError = ErrorDef & {
	key: string
}

export type PageKey = 'main' | 'settings'

export interface AppState {
	page: PageKey
	loading: boolean
	settings: Settings
	reminders: Reminder[]
	errors: AppError[],
	poeStatus: null | PoEStatus
}

type Setters = {
	addReminder: (r: Reminder) => void
	setSettings: (s: Settings) => void
	saveReminder: (r: Reminder) => void
	setReminders: (rs: Reminder[]) => void
	setPoEStatus: (p: null | PoEStatus) => void
	addError: (e: ErrorDef) => void
	removeError: (key: string) => void
	clearContextErrors: (e: ErrorContext) => void
	setLoading: (l: boolean) => void
	setPage: (p: PageKey) => void
}

type ZustandStore = AppState & Setters

const log = (config) => (set: ZustandSetPlaceHolderType, get: ZustandGetPlaceHolderType, api: ZustandAPIPlaceHolderType) =>
	config(
		(...args: any[]) => {
			set(...args)
			const updated = get() as AppState

			// TODO: Make sure there's some pruning of certain fields that we don't need to save
			// Like whether a reminder is currently playing or not, which isn't something that is saved to the db
			// Derived fields like whether a reminder is currently in queue to be played is a derived field based
			// on there being a playing reminder. It should not be saved.
			// TODO: settingsStoreToStorage() and settingsStorageToStore() -- Maybe some less confusing names? Database instead of storage?
			// TODO: Also maybe move this into a different function instead of middleware? saveReminders = update in store + save in db
			AppDatabase.set(DB_KEY_REMINDERS, updated.reminders).then(() => {
				console.log('saving reminders', updated.reminders)
			})
		},
		get,
		api
	)

export const AppDatabase = new Store(".settings.dat");

type ZustandSetPlaceHolderType = any
type ZustandGetPlaceHolderType = any
type ZustandAPIPlaceHolderType = any

export const useAppStore = create<ZustandStore>()(log((set: ZustandSetPlaceHolderType) => {
	const state : ZustandStore = {
		...defaultState(),
		setPage: (p: PageKey) => set(() => ({
			page: p,
		})),
		setLoading: (l: boolean) => set(() => ({
			loading: l,
		})),
		setSettings: (s: Settings) => set(() => ({
			settings: {
				...s,
				lastSavedAt: new Date(),
			},
		})),
		saveReminder: (toSave: Reminder) => set((state: AppState) => {
			return {
				reminders: [
					...state.reminders
				].map((r) => {
					if (r.id === toSave.id) {
						return toSave
					}

					return r
				})
			}
		}),
		addReminder: (r: Reminder) => set((state: AppState) => {
			return {
				reminders: [
					r,
					...state.reminders,
				]
			}
		}),
		setReminders: (r: Reminder[]) => set(() => ({
			reminders: r,
		})),
		setPoEStatus: (p: null | PoEStatus) => set(() => ({
			poeStatus: p ? {
				...p,
			} : null,
		})),
		addError: (def: ErrorDef) => set((state: AppState) => {
			const err : AppError = {
				message: def.message,
				key: def.key || 'auto_' + Date.now() + '_' + state.errors.length,
				context: def.context
			}

			if (def.message.indexOf('Error: ') === 0) {
				def.message = def.message.substring('Error: '.length)
			}

			for (let i = 0; i < state.errors.length; i++) {
				const se = state.errors[i]
				if (se.key && se.key === def.key) {
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
	}
	return state
}))


