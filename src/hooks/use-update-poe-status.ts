import {useEffect} from "react";
import {getPoEClientStatus, poeStatusesEq} from "../lib/poe";
import {useAppStore} from "../lib/store";

export default function useUpdatePoEStatus () {
	const {
		loading,
		settings,
		addError,
		setPage,
		setPoEStatus,
		get,
		clearContextErrors,
	} = useAppStore()

	useEffect(() => {
		if (loading) {
			return
		}

		function readClientTxt () {
			if (!settings.poeClientTxtPath) {
				if (!settings.default) {
					console.log(`TODO: Some kind of timeout to search in likely places for Client. 
		Timeout so that if the REAL clientTxtPath gets loaded asynchronosly in a second we don't bother
		Use Promise.all and use whichever one is is found with the most recent last update date`)
				}
				else {
					addError({
						type: 'known',
						context: 'poe_status',
						key: 'no_client_txt',
						message: 'Missing the Client.txt location in settings'
					})
					setPage('settings')
				}
				return
			}
			getPoEClientStatus(settings.poeClientTxtPath).then((stat) => {
				const {poeStatus} = get()
				if (poeStatusesEq(poeStatus, stat)) {
					return
				}
				setPoEStatus(stat)
				clearContextErrors('poe_status')
			}).catch((err) => {
				addError({
					type: 'unknown',
					context: 'poe_status',
					error: err,
				})
			})
		}

		let interval = setInterval(() => {
			readClientTxt()
		}, 1000)
		readClientTxt()

		return () => {
			clearInterval(interval)
		}
	}, [loading, settings.poeClientTxtPath])
}
