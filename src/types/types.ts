import {AppError} from "../lib/state";
import {PoEStatus} from "../lib/poe";

export type Settings = {
	volume: number // 0 to 100
	ttsVoice: number // Index when calling getVoices()
	ttsVoiceRandom: boolean
	clientTxt: string
}

export type Reminder = {
	id: string
	text: string
	playAfter: Date
	playedAt: null | Date
	createdAt: Date
}

export interface AppState {
	settings: Settings
	reminders: Reminder[]
	errors: AppError[],
	poeStatus: null | PoEStatus
}

