import {AppError} from "../lib/state";

export type PauserKey = 'poe' // | 'steam'

type PauserPoESettings = {
	clientTxtPath: string
	pauseWhileAFK: boolean
	unpauseAfterXSecondsOfInactivity: number // TODO: Rename this
}

export type PauserPoEInfo = {
	zoneName: string
	afk: boolean
	isSafe: boolean
}

type PauserSettings = PauserPoESettings // | PauserSteamSettings

export type Pauser = {
	key: PauserKey
	settings: PauserSettings
}

export type PauserInfo = {
	key: PauserKey
	info: PauserPoEInfo
	lastUpdated: Date
} // | PauserSteamInfo

export type Settings = {
	volume: number // 0 to 100
	ttsVoice: string
	ttsVoiceRandom: boolean
	pausers: Partial<Record<PauserKey, PauserSettings>>
}

export type Reminder = {
	id: string
	text: string
	playAfter: Date
	playedAt: null | Date
	createdAt: Date
}

export type AppState = {
	settings: Settings
	pausers: Record<PauserKey, PauserInfo>
	reminders: Reminder[]
	errors: AppError[],
}

