import {useAppStore} from "../lib/store";
type AudioKey = 'success' | 'error'
let audios : Record<AudioKey, HTMLAudioElement> = {
	'success': new Audio('./bip.mp3'),
	'error': new Audio('./error.mp3')
}

const audioBoosts : Partial<Record<AudioKey, number>> = {
	'success': 1.5,
}

export function usePlayAudio () {
	const {get} = useAppStore()
	function play (type: AudioKey) {
		const settings = get().settings
		const audio = audios[type]

		// Some blips are quiet so we can boost their volume
		const boost = audioBoosts[type] || 1

		audio.volume = Math.min(settings.volume * boost/100, 1)
		audio.play()
	}
	return {
		play
	}
}
