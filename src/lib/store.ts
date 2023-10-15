import { create } from 'zustand'
import {AppState, Reminder, Settings} from "../types/types";
import {AppError, defaultState} from "./state";
import { Store } from "tauri-plugin-store-api";

type Setters = {
	addReminder: (r: Reminder) => void
	setSettings: (s: Settings) => void
	saveReminder: (r: Reminder) => void
	setReminders: (rs: Reminder[]) => void
	addError: (e: AppError) => void
}

type State = AppState & Setters

const log = (config) => (set, get, api) =>
	config(
		(...args) => {
			console.log('  applying', args)
			set(...args)
			const updated = get()

			// TODO: Make sure there's some pruning of certain fields that we don't need to save
			// Like whether a reminder is currently playing or not, which isn't something that is saved to the db
			// Derived fields like whether a reminder is currently in queue to be played is a derived field based
			// on there being a playing reminder. It should not be saved.
			AppStorage.set('settings', updated.settings).then(() => {
				console.log('saved settings')
			})
			AppStorage.set('reminders', updated.reminders).then(() => {
				console.log('saved reminders')
			})
		},
		get,
		api
	)


export const AppStorage = new Store(".settings.dat");

export const useAppStore = create<State>()(log((set) => {
	const state : State = {
		...defaultState(),
		setSettings: (s: Settings) => set((state) => ({
			settings: s,
		})),
		saveReminder: (toSave: Reminder) => set((state) => {
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
		addReminder: (r: Reminder) => set((state) => {
			return {
				reminders: [
					r,
					...state.reminders,
				]
			}
		}),
		setReminders: (r: Reminder[]) => set((state) => ({
			reminders: r,
		})),
		addError: (e: AppError) => set((state) => {
			for (let i = 0; i < state.errors.length; i++) {
				const se = state.errors[i]
				console.log('se key', se.key)
				if (se.key && se.key === e.key) {
					const newErrors = se.errors
					se.errors[i] = e
					return {
						errors: [
							...newErrors
						]
					}
				}
			}

			e.key = e.key || 'auto_' + Date.now() + '_' + state.errors.length
			return {
				errors: [
					e,
					...state.errors,
				]
			}
		})
	}
	return state
}))


