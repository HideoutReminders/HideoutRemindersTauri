import {ReactComponent as ShieldBash} from '../assets/icons/shield-bash.svg'
import {ReactComponent as WhiteTower} from '../assets/icons/white-tower.svg'
import {useAppStore} from "../lib/store";

export default function PoEStatus () {
	const {poeStatus} = useAppStore()
	let icon = null
	let text = 'Waiting...'
	let lastUpdated = null
	let clsName = 'waiting'

	// TODO: Show something real if there's no status
	if (!poeStatus) {
		return <div>...</div>
	}

	if (poeStatus) {
		clsName = true ? 'safe' : 'combat'
		icon = () => true ? <WhiteTower /> : <ShieldBash />
		text = poeStatus.zoneName
		lastUpdated = poeStatus.zoneChangedAt
	}

	const lens : string[] = []
	for (let i = 5; i <= text.length; i++) {
		lens.push(`len-${i}`)
	}

	return <div className={lens.join(' ' ) + ' ' + clsName}>
		{icon} {text} {lastUpdated}
	</div>
}
