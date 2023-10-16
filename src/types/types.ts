import {PoEStatus} from "../lib/poe";
import {AppError} from "../lib/store";

export type Settings = {
	volume: number // 0 to 100
	ttsVoice: number // Index when calling getVoices()
	ttsVoiceRandom: boolean
	poeClientTxtPath: string
	lastSavedAt: null | Date
	default: boolean
}

export type Reminder = {
	id: string
	text: string
	playAfter: Date
	playedAt: null | Date
	createdAt: Date
}
