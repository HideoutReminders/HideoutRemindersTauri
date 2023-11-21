export type Settings = {
	volume: number // 0 to 100
	ttsVoiceIdx: number // Index when calling getVoices()
	ttsVoiceRandom: boolean
	poeClientTxtPath: string
	lastSavedAt: null | Date
	default: boolean
	safeZoneNames: string[]
}

export type Reminder = {
	id: string
	text: string
	playAfter: Date
	playedAt: null | Date
	createdAt: Date
	parsed?: any
}
