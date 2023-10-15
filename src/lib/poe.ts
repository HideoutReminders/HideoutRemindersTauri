import { invoke } from '@tauri-apps/api/tauri'

export type PoEStatus = {
	zoneName: string
	zoneChangedAt: Date
	afk: boolean
	afkAt: boolean
	mostRecentLineAt: Date
}

export async function getPoEClientStatus (clientTxtPath: string) : Promise<PoEStatus> {
	if (!clientTxtPath) {
		throw new Error('path is blank')
	}
	const statusJSON = await invoke('poe_status', {
		clientTxtPath,
	}) as string
	console.log('statusJSON', statusJSON)
	let status : PoEStatus
	try {
		status = JSON.parse(statusJSON) as PoEStatus
		status.mostRecentLineAt = new Date(status.mostRecentLineAt)
		status.zoneChangedAt = new Date(status.zoneChangedAt)
	}
	catch (ex) {
		console.log('Sup with your JSON?')
		if (typeof statusJSON === 'string' && statusJSON.length > 0) {
			throw new Error(statusJSON)
		}
		throw ex
	}
	console.log('status', status)
	return status
}
