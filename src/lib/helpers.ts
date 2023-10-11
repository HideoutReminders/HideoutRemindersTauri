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

	return date + ' ' + time
}
