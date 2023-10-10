export function getRandomInt (min: number, max: number) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getRandom<T>(items: T[]) : T {
	return items[getRandomInt(0, items.length-1)]
}
