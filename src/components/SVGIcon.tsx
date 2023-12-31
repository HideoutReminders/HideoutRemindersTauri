export type SVGType = 'error' |
	'warning' |
	'success' |
	'spinner' |
	'play' |
	'talking' |
	'waiting' |
	'queued' |
	'done' |
	'placeholder'

export default function SVGIcon ({type, className}: {type: SVGType, className?: string}) {
	if (type === 'play') {
		return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
			<g className="" transform="translate(0,0)">
				<path
					d="M106.854 106.002a26.003 26.003 0 0 0-25.64 29.326c16 124 16 117.344 0 241.344a26.003 26.003 0 0 0 35.776 27.332l298-124a26.003 26.003 0 0 0 0-48.008l-298-124a26.003 26.003 0 0 0-10.136-1.994z"
					fill="currentColor" fillOpacity="1"/>
			</g>
		</svg>
	}

	if (type === 'placeholder') {
		return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
			<g className="" transform="translate(0,0)">
				<path
					d="M478.7 419c-17.8 11-79.9 43-135.9 2-66.8 55-136.4 18-154.1 7l100.2-46.7c14.9 10.5 52.1 29.7 95.2-.4zM161.9 164.8c14.4-12.3 33.4-19.7 54.1-19.7 36.8 0 67.9 23.4 78.6 55.7h33.8c10.6-32.3 41.8-55.7 78.6-55.7 45.6 0 82.4 36 82.4 80.1 0 44.2-36.8 80.2-82.4 80.2-2.4 0-4.8-.1-7.1-.3 6.7 18.7 11.4 39 12.1 60.2l-31.8-12.9-5.7 4.5c-40.9 32.6-75.3.7-75.3.7l-6.2-5.8-43.9 20.4c-2.9-28.9 6.1-56.6 16.3-82.8-13.8 10-30.8 16-49.4 16-45.6 0-82.4-36-82.4-80.2 0-4.2.3-8.3.9-12.3L47.02 282l5.66 48.7-20.7 2.4-7-60.2zM407 284.6c33.9 0 61.6-26.5 61.6-59.4 0-32.8-27.7-59.3-61.6-59.3-29.9 0-55 20.6-60.5 47.9 11.6 14 29.7 38.3 43.9 68.6 5.3 1.4 10.8 2.2 16.6 2.2zm-252.6-59.4c0 32.9 27.7 59.4 61.6 59.4 33.9 0 61.6-26.5 61.6-59.4 0-32.8-27.7-59.3-61.6-59.3-13.8 0-26.6 4.4-36.9 11.8l-4.2 3.3c-12.6 10.9-20.5 26.6-20.5 44.2zm326.8-122.5s-72.6-48.8-146.2-.1l23.1 34.8c50.2-33.3 99.8-.1 99.8-.1zm-315.6 34.6s49.6-33.2 99.9.1l23-34.8c-73.5-48.7-146.1.1-146.1.1z"
					fill="#fff" fillOpacity="1"/>
			</g>
		</svg>
	}

	if (type === 'spinner') {
		return <svg aria-hidden="true"
			className="inline w-16 h-16 mr-2 text-gray-200 animate-spin dark:text-gray-600 fill-primary"
			viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
				fill="currentColor" />
			<path
				d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
				fill="currentFill" />
		</svg>
	}

	if (type === 'error' || type === 'warning') {
		return <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none"
					 viewBox="0 0 24 24">
				<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
			</svg>
	}

	return null
}
