import {useAppStore} from "../lib/store";
import {isPoEPausingReminders} from "../lib/poe";
import {ReactNode} from "react";
import TimeAgo from "./TimeAgo";

export default function PoEStatus () {
	const {poeStatus} = useAppStore()
	if (!poeStatus) {
		return <div>?</div>
	}

	const pause = isPoEPausingReminders(poeStatus)
	let byline: ReactNode
	let bylineClasses = ''
	if (pause.reason === "afk") {
		byline = `AFK in ${poeStatus.zoneName}`
	}
	else if (pause.reason === "in_safe_zone") {
		byline = `Safe in ${poeStatus.zoneName}`
	}
	else if(pause.reason === "in_unsafe_zone") {
		// TODO: Detect the right verb based on where you are. "Bossing", "Mapping", "Delving", "Heisting", etc
		byline = `Fighting in ${poeStatus.zoneName}`
	}
	else if(pause.reason === "stale_client_txt") {
		byline = <>No activity since <TimeAgo date={poeStatus.mostRecentLineAt} /></>
	}
	else if (pause.reason === 'no_zone') {
		byline = `Can't find the zone name`
		bylineClasses = 'text-warning'
	}
	else {
		bylineClasses = 'text-danger'
		byline = 'No reason found: ' + pause.reason
	}

	return <div className={'flex flex-col text-right p-1 pr-3'}>
		<div className={'text-md font-bold ' + (pause.pausing ? 'text-warning' : 'text-success')}>{pause.pausing ? 'Pausing reminders' : 'Reminders will play'}</div>
		<div className={bylineClasses}>{byline}</div>
	</div>
}
