import {invoke} from '@tauri-apps/api/tauri'

const SAFE_ZONES = `Lioneye's Watch
The Forest Encampment
The Sarn Encampment
Highgate
Overseer's Tower
Lioneye's Watch
The Bridge Encampment
The Sarn Encampment
Highgate
Oriath Docks
Karui Shores`.split('\n')

export type PoEStatus = {
	zoneName: string
	zoneChangedAt: Date
	afk: boolean
	afkAt: null | Date
	mostRecentLineAt: Date
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
		console.log('response', response)
		if (response.success) {
			const r = response as PoEClientTxtResponse
			status = {
				mostRecentLineAt: new Date(r.most_recent_line_at),
				zoneChangedAt: new Date(r.zone_changed_at),
				zoneName: r.zone_name,
				afk: !!r.afk,
				afkAt: r.afk ? new Date(r.afk_at) : null,
			}
		}
		else {
			const r = response as InvokeError
			console.log('r', r)
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

function zoneNameIsSafe (zoneName: string) {
	return SAFE_ZONES.includes(zoneName) || zoneName.indexOf('Hideout') > 0
}

type PoEPauseReason = 'no_status' | 'in_unsafe_zone' | 'in_safe_zone' | 'stale_client_txt' | 'afk' | 'no_zone'
export type PoEPausing = {
	pausing: boolean
	reason: PoEPauseReason
}
export function isPoEPausingReminders (status: null | PoEStatus) : PoEPausing {
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
		return {
			pausing: false,
			reason: "no_zone",
		}
	}

	if (zoneNameIsSafe(status.zoneName)) {
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
