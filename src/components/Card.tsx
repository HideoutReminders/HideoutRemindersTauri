import {ReactNode} from "react";

export default function Card ({children, className}: {children: ReactNode, className?: string}) {
	return <div className={'m-4 p-4 shadow-lg bg-base-100 rounded-lg ' + className}>
		{children}
	</div>
}
