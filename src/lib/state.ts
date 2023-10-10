import {Dispatch, PauserInfo, PauserKey, Reminder, State} from "../types/types";
import {createContext, useContext, useEffect, useReducer} from "react";
import {getReminders, saveRemindersJSONFile} from "./reminders";
import App from "../App";

export function defaultState () : State {
	const pausers : Record<PauserKey, PauserInfo> = {
		poe: {
			key: "poe",
			info: {
				zoneName: '',
				isSafe: false,
				afk: false,
			},
			lastUpdated: new Date(),
		}
	}
	return {
		settings: {
			volume: 100,
			ttsVoice: '',
			ttsVoiceRandom: true,
			pausers: {},
		},
		errors: [],
		reminders: [],
		pausers: pausers,
	}
}

type ErrorContext = 'reminders_add' | 'reminders_edit' | 'settings_save'

export type AppError = {
	context: ErrorContext
	message: string
}

export type Action = {type: 'SET_VOLUME', payload: number} |
	{type: 'SET_TTS_RANDOM', payload: boolean} |
	{type: 'SET_REMINDERS', payload: Reminder[]} |
	{type: 'ADD_REMINDER', payload: Reminder} |
	{type: 'SET_ERROR', payload: AppError}

export function reducer (state: State, action: Action) : State {
	let sortReminders = false
	if (action.type === 'SET_VOLUME') {
		state.settings.volume = action.payload
	}
	else if (action.type === 'SET_TTS_RANDOM') {
		state.settings.ttsVoiceRandom = action.payload
	}
	else if (action.type === 'SET_REMINDERS') {
		state.reminders = action.payload
		sortReminders = true
	}
	else if (action.type === 'ADD_REMINDER') {
		state.reminders = [
			action.payload,
			...state.reminders,
		]
		sortReminders = true
	}

	if (sortReminders) {
		state.reminders = state.reminders.sort((a, b) => {
			return a.playAfter < b.playAfter ? -1 : 1
		})
	}

	return {
		...state
	}
}

export function reducerWithSaving (state: State, action: Action) {
	const newState = reducer(state, action)

	const doSaveSettings = ['SET_VOLUME'].includes(action.type)
	const doSaveReminders = ['SET_REMINDERS', 'ADD_REMINDER'].includes(action.type)

	if (doSaveSettings) {
		console.log('TODO: save the settings json')
	}
	if (doSaveReminders) {
		saveRemindersJSONFile(newState.reminders).then(() => {
			console.log('yay saved')
		})
	}

	return newState
}

export function useAppState () {
	const [state, dispatch] = useReducer<State>(reducerWithSaving, defaultState())

	useEffect(() => {
		async function load () {
			const reminders = await getReminders()
			dispatch(state, {
				type: 'SET_REMINDERS',
				payload: reminders,
			})
		}
		load()
	}, [])

	return [state, dispatch]
}



export const AppContext = createContext<{
	state: State,
	dispatch: Dispatch,
}>({
	state: defaultState(),
	dispatch: (d: State) => {
		throw new Error('No!')
		return d
	}
})

export function useAppContext () {
	const ctx = useContext(AppContext)
	return ctx
}
