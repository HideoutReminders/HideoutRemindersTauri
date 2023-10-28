import {invoke} from '@tauri-apps/api/tauri'
import {AppError} from "./store";
import {Settings} from "../types/types";

export const POE_SAFE_ZONES = `Lioneye's Watch
Azurite Mine
Highgate
Oriath Docks
Overseer's Tower
Rogue Harbour
The Bridge Encampment
The Forest Encampment
The Halls of the Dead
The Menagerie
The Sarn Encampment
Karui Shores`.split('\n').sort()

export const POE_CLIENT_TXT_DIRS = [
	'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile\\logs',
	'C:\\Program Files (x86)\\Grinding Gear Games\\Path of Exile\\logs',
	'C:\\PoE\\Client.txt',
]

export type PoEStatus = {
	zoneName: string
	zoneChangedAt: null | Date
	afk: boolean
	afkAt: null | Date
	mostRecentLineAt: Date
	reminderPrompt: string
	reminderAt: null | Date
}

type InvokeError = {
	success: false,
	message: string
}

export type PoEClientTxtResponse = {
	success: true
	zone_name: string
	zone_changed_at: string
	afk: boolean
	afk_at: string
	most_recent_line_at: string
	reminder_at: string
	reminder_prompt: string
}
export async function getPoEClientStatus (clientTxtPath: string) : Promise<PoEStatus> {
	if (!clientTxtPath) {
		throw new Error('path is blank')
	}
	const responseJSON = await invoke('poe_status', {
		clientTxtPath,
	}) as string
	let status : PoEStatus
	let validJSON = false
	try {
		const response = JSON.parse(responseJSON) as (PoEClientTxtResponse | InvokeError)
		validJSON = true
		if (response.success) {
			const r = response as PoEClientTxtResponse
			status = {
				mostRecentLineAt: new Date(r.most_recent_line_at),
				zoneChangedAt: r.zone_changed_at ? new Date(r.zone_changed_at) : null,
				zoneName: r.zone_name,
				afk: !!r.afk,
				afkAt: r.afk ? new Date(r.afk_at) : null,
				reminderAt: r.reminder_at ? new Date(r.reminder_at) : null,
				reminderPrompt: r.reminder_prompt
			}
		}
		else {
			const r = response as InvokeError
			const e : AppError = {
				key: 'poe_status',
				message: r.message,
				context: 'poe_status',
			}
			throw e
		}
	}
	catch (ex) {
		// This if block is in case the invoke returns just a string,
		// like if the response is "Error: failed" instead of `{"success": false, "message": failed}`
		if (!validJSON && responseJSON.length) {
			throw new Error(responseJSON)
		}
		throw ex
	}
	return status
}

function zoneNameIsSafe (zoneName: string, settings: Settings) {
	if (!settings.safeZoneNames) {
		return false
	}
	const lowerNames = settings.safeZoneNames.map(x => x.toLowerCase())
	return lowerNames.includes(zoneName.toLowerCase()) || zoneName.toLowerCase().indexOf('hideout') > 0
}

type PoEPauseReason = 'no_status' | 'in_unsafe_zone' | 'in_safe_zone' | 'stale_client_txt' | 'afk' | 'no_zone'
export type PoEPausing = {
	pausing: boolean
	reason: PoEPauseReason
}
export function getPoEPausingStatus (status: null | PoEStatus, settings: Settings) : PoEPausing {
	if (!status) {
		return {
			pausing: false,
			reason: "no_status"
		}
	}

	// If your client.txt hasn't been updated in this long, we assume you've closed the game
	const cutoffMS = 1000 * 60 * 10
	const diff = Date.now() - status.mostRecentLineAt.getTime()
	if (diff >= cutoffMS) {
		return {
			pausing: false,
			reason: "stale_client_txt",
		}
	}

	if (status.afk) {
		return {
			pausing: false,
			reason: 'afk',
		}
	}

	if (!status.zoneName) {
		console.log('????', status)
		return {
			pausing: false,
			reason: "no_zone",
		}
	}

	if (zoneNameIsSafe(status.zoneName, settings)) {
		return {
			pausing: false,
			reason: 'in_safe_zone'
		}
	}

	return {
		pausing: true,
		reason: 'in_unsafe_zone'
	}
}

export function isPoEStatusPausing (status: null | PoEStatus, settings: Settings) {
	if (!settings) {
		throw new Error(`Settings cant be blank`)
	}
	const p = getPoEPausingStatus(status, settings)
	return p.pausing
}

export function poeStatusesEq (status1: PoEStatus | null, status2: PoEStatus | null) {
	if (status1 === null) {
		return status2 === null
	}
	if (status2 === null) {
		return false
	}
	if (`${status1.mostRecentLineAt}` !== `${status2.mostRecentLineAt}`) {
		return false
	}
	if (`${status1.zoneChangedAt}` !== `${status2.zoneChangedAt}`) {
		return false
	}
	if (status1.zoneName !== status2.zoneName) {
		return false
	}
	if (status1.afk !== status2.afk) {
		return false
	}
	return true
}
