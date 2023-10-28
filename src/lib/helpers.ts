export function getRandomInt (min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandom<T>(items: T[]) : T {
	return items[getRandomInt(0, items.length-1)]
}


export function formatDateTime (d: Date) : string {
	let date = d.toLocaleDateString('en-US', {
		month: 'short',
		weekday: 'short',
		day: 'numeric',
	})

	const nth = d.getDate().toString().split('').pop()
	if (nth === '1') {
		date += 'st'
	}
	else if (nth === '2') {
		date += 'nd'
	}
	else if (nth === '3') {
		date += 'rd'
	}
	else {
		date += 'nth'
	}

	const time = d.toLocaleTimeString('en-US', {
		hour: "numeric",
		minute: '2-digit',
	})

	const dateString = d.toDateString()
	if (dateString === new Date().toDateString()) {
		date = 'Today'
	}
	else if (dateString === new Date(Date.now() + 1000 * 60 * 60 * 24).toDateString()) {
		date = 'Tomorrow'
	}

	return date + ' ' + time + (new Date().getFullYear() !== d.getFullYear() ? ' ' + d.getFullYear() : '')
}


let loadedVoices : SpeechSynthesisVoice[] = []
export async function getVoices () : Promise<SpeechSynthesisVoice[]> {
	return new Promise((res) => {
		if (loadedVoices) {
			res(loadedVoices)
			return
		}
		window.speechSynthesis.onvoiceschanged = () => {
			const sorted : SpeechSynthesisVoice[] = window.speechSynthesis.getVoices().sort((a, b) => {
				if (a.default) {
					return -1
				}

				return a.name < b.name ? -1 : 1
			})
			loadedVoices = sorted
			res(loadedVoices)
			window.speechSynthesis.onvoiceschanged = null
		}
		// Asking for voices appears to trigger the browser looking for them, which will trigger the callback above
		const voices = speechSynthesis.getVoices()
		if (!loadedVoices || (voices.length > loadedVoices['length'])) {
			loadedVoices = voices
		}
	})
}
