import {useAppStore} from "../lib/store";
import {Reminder, Settings} from "../types/types";

type Play = {
	text: string
	id: string
}

const queue : Play[] = []

export default function usePlayTTS () {
	const {settings, playing, setPlaying, clearPlaying} = useAppStore()

	async function playText (text: string, id: string) {
		return new Promise((res, rej) => {
			function attemptPlay () {

				// TODO: Add the item to the queue and then play things from the queue
				if (playing) {
					setTimeout(() => {
						attemptPlay()
					}, 250)
					return
				}
				const utterThis = new SpeechSynthesisUtterance(text);
				const voices = window.speechSynthesis.getVoices()
				utterThis.voice = voices[settings.ttsVoiceIdx]
				utterThis.volume = settings.volume / 100
				utterThis.onend = () => {
					clearPlaying()
					res()
				}
				utterThis.onerror = (evt) => {
					clearPlaying()
					rej(evt.error)
				}
				setPlaying(id)
				window.speechSynthesis.speak(utterThis);
			}
			attemptPlay()
		})
	}

	async function playReminder (r: Reminder) {
		await playText(r.text, r.id)
	}

	return {
		playText,
		playReminder,
	}
}
