import {create} from 'zustand'
import {Reminder, Settings} from "../types/types";
import {PoEStatus} from "./poe";

export function defaultSettings () : Settings {
	return {
		volume: 100,
		ttsVoiceIdx: 0,
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
		playingId: null,
		playing: false,
	}
}

export type ErrorContext = 'reminders_add' | 'reminders_edit' | 'reminders_delete' | 'settings_save' | 'poe_status' | 'general'

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
	playing: boolean
	playingId: null | string // 'preview' or 'reminder_XXXX'
}

type Setters = {
	setSettings: (s: Settings) => void
	setReminders: (rs: Reminder[]) => void
	setPoEStatus: (p: null | PoEStatus) => void
	addError: (e: ErrorDef) => void
	removeError: (key: string) => void
	clearContextErrors: (e: ErrorContext) => void
	setLoading: (l: boolean) => void
	setPage: (p: PageKey) => void
	setPlaying: (rid?: string) => void
	clearPlaying: () => void
}

type ZustandStore = AppState & Setters

type ZustandSetPlaceHolderType = any

export const useAppStore = create<ZustandStore>()((set: ZustandSetPlaceHolderType) => {
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
		setSettings: (s: Settings) => set(() => ({
			settings: {
				...s,
				lastSavedAt: new Date(),
			},
		})),
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
})
