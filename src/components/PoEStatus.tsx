import {useAppStore} from "../lib/store";
import {getPoEPausingStatus} from "../lib/poe";
import {ReactNode} from "react";
import TimeAgo from "./TimeAgo";
import AlarmOffIcon from '@mui/icons-material/AlarmOff';
import AlarmOnIcon from '@mui/icons-material/AlarmOn';
import AlarmIcon from '@mui/icons-material/Alarm';

function Byline (text: string, updateAt: Date) {
	return <>{text} <span className={'byline-updated-at'}><TimeAgo date={updateAt} /></span></>
}

export default function PoEStatus () {
	const {poeStatus, playing, playingId, reminders, settings} = useAppStore()
	if (!poeStatus) {
		return <div></div>
	}

	const paused = getPoEPausingStatus(poeStatus, settings)
	let byline: ReactNode
	let bylineClasses = ''
	let iconColor = paused.pausing ? 'text-warning' : 'text-success'

	if (paused.reason === "afk") {
		byline = Byline(`AFK in ${poeStatus.zoneName}`, poeStatus.mostRecentLineAt as Date)
	}
	else if (paused.reason === "in_safe_zone") {
		byline = Byline(`Safe in ${poeStatus.zoneName}`, poeStatus.mostRecentLineAt as Date)
	}
	else if(paused.reason === "in_unsafe_zone") {
		// TODO: Detect the right verb based on where you are. "Bossing", "Mapping", "Delving", "Heisting", etc
		byline = Byline(`In ${poeStatus.zoneName}`, poeStatus.mostRecentLineAt as Date)
	}
	else if(paused.reason === "stale_client_txt") {
		byline = <>No PoE since <TimeAgo date={poeStatus.mostRecentLineAt} /></>
	}
	else if (paused.reason === 'no_zone') {
		byline = `Can't find the zone name`
		bylineClasses = 'text-warning'
	}
	else {
		bylineClasses = 'text-danger'
		byline = 'No reason found: ' + paused.reason
	}

	const iconSize = {
		fontSize: 40
	}
	let title = paused.pausing ? 'Pausing reminders' : 'Reminders will play'
	let titleClasses = paused.pausing ? 'text-warning' : 'text-success'
	let icon = paused.pausing ? <AlarmOffIcon sx={iconSize} /> : <AlarmIcon sx={iconSize} />

	// Change the icon and text if we're playing a reminder
	// We don't change it for playing previews off voices
	if (playing && playingId) {
		const r = reminders.find(x => x.id === playingId)
		title = r ? r.text : 'Playing audio'
		iconColor = 'text-success'
		titleClasses = 'text-success'
		icon = <AlarmOnIcon sx={iconSize} />
	}


	return <div className={'flex p-2 ps-3'}>
		<div className={'me-2 text-lg flex items-center ' + iconColor}>
			{icon}
		</div>
		<div className={'flex items-start flex-col content-center'}>
			<div className={'text-md font-bold ' + titleClasses}>{title}</div>
			<div className={'status-byline ' + bylineClasses}>{byline}</div>
		</div>
	</div>
}
