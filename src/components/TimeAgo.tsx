import {ReactNode, useEffect, useState} from "react";

export default function TimeAgo ({date}: {date: Date}) {
	const [inner, setInner] = useState('')

	useEffect(() => {
		function update () {
			if (!date) {
				return
			}
			const diffMS = Date.now() - date.getTime()
			const diffS = Math.floor(diffMS / 1000)

			if (diffS < 10) {
				setInner('just now')
			}
			else if (diffS < 60) {
				setInner('<1m')
			}
			else if (diffS < (60 * 60)) {
				setInner(Math.round(diffS / 60) + 'm ago')
			}
			else if (diffS < (60 * 60 * 24)) {
				setInner(date.toLocaleTimeString('en-US', {
					minute: "2-digit",
					hour: 'numeric'
				}))
			}
			else {
				setInner(date.toLocaleString('en-US', {
					minute: "2-digit",
					hour: 'numeric',
					month: 'short',
					day: 'numeric',
					year: 'numeric',
				}))
			}
		}
		update()
		let interval = setInterval(update, 1000)
		return () => {
			clearInterval(interval)
		}
	}, [`${date}`])

	if (!date) {
		return null
	}

	return <span className={'time-ago'}>{inner}</span>
}
