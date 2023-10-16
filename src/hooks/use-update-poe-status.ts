import {useEffect} from "react";
import {getPoEClientStatus} from "../lib/poe";
import {AppError, useAppStore} from "../lib/store";

export default function useUpdatePoEStatus () {
	const {
		loading,
		settings,
		addError,
		setPage,
		setPoEStatus,
		clearContextErrors,
	} = useAppStore()

	useEffect(() => {
		if (loading) {
			console.log('do not do this while loading')
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
						context: 'poe_status',
						key: 'no_client_txt',
						message: 'Missing the Client.txt location in settings'
					})
					setPage('settings')
				}
				return
			}
			getPoEClientStatus(settings.poeClientTxtPath).then((stat) => {
				setPoEStatus(stat)
				clearContextErrors('poe_status')
			}).catch((err: AppError | unknown) => {
				setPoEStatus(null)
				if (err.context) {
					addError(err as AppError)
					return
				}
				addError({
					context: 'poe_status',
					key: 'poe_status',
					message: err.toString(),
				})
			})
		}

		let interval = setInterval(() => {
			readClientTxt()
		}, 10000)
		readClientTxt()

		return () => {
			clearInterval(interval)
		}
	}, [loading, settings.poeClientTxtPath])
}
