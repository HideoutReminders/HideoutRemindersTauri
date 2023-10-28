import {useAppStore} from "../lib/store";
import {Reminder, Settings} from "../types/types";
import {getVoices} from "../lib/helpers";

export default function usePlayTTS () {
	const {playing, setPlaying, clearPlaying} = useAppStore()

	async function playText (text: string, id: string | undefined, settings: Settings) : Promise<void> {
		return new Promise((res, rej) => {
			async function attemptPlay () {

				// TODO: Add the item to the queue and then play things from the queue
				if (playing) {
					setTimeout(() => {
						attemptPlay()
					}, 250)
					return
				}
				const utterThis = new SpeechSynthesisUtterance(text);
				const voices = await getVoices()
				const voice = voices[settings.ttsVoiceIdx]
				utterThis.voice = voice
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

	async function playReminder (r: Reminder, settings: Settings) {
		await playText(r.text, r.id, settings)
	}

	return {
		playText,
		playReminder,
	}
}
