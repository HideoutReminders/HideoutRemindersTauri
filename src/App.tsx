import "./styles.css";
import MainPage from "./pages/MainPage";
import SettingsPage from "./pages/SettingsPage";
import {AppError, PageKey, useAppStore} from './lib/store'
import SVGIcon from "./components/SVGIcon";
import useLoadApp from "./hooks/use-load-app";
import useUpdatePoEStatus from "./hooks/use-update-poe-status";
import PoEStatus from "./components/PoEStatus";

function App () {
	const {
		errors,
		page,
		removeError,
		loading,
	} = useAppStore()
	useLoadApp()
	useUpdatePoEStatus()

	if (loading) {
		return <div>
			<div className="flex justify-center items-center w-screen h-screen">
				<div role="status">
					<SVGIcon type={'spinner'} />
					<span className="sr-only">Loading...</span>
				</div>
			</div>
		</div>
	}

	return <>
		<div id={'header'} className={'sticky top-0 z-50 flex w-full bg-slate-900 drop-shadow-lg justify-between'}>
			<ul className={'flex-0 menu menu-horizontal'}>
				<NavItem
					label={'Reminders'}
					page={'main'}
				/>
				<NavItem
					label={'Settings'}
					page={'settings'}
				/>
			</ul>
			<PoEStatus />
		</div>
		<div id={'content'} className={''}>{/*TODO: Make this the only vertical scroll that we have somehow. I think we remove the sticky from header?*/}
			<div className={'relative flex-1 p-4 pb-0 ' + (errors.length === 0 ? 'hidden' : 'block')}>
				{errors.map((e: AppError) => {
					let label = ''
					let canDelete = true
					if (e.context === 'poe_status') {
						label = 'PoE Client Txt'
						canDelete = false
					}

					return <div className="alert alert-error gap-2" key={e.key}>
						<SVGIcon type={'error'} />
						<div>
							{label && <><strong>{label}:</strong>{" "}</>}
							<span>{e.message || 'Unknown error occurred'}</span>
						</div>
						{canDelete && <button type={'button'} onClick={() => {
							removeError(e.key)
						}}>
							X
						</button>}
					</div>
				})}
			</div>
			{page === 'main' && <MainPage />}
			{page === 'settings' && <SettingsPage />}
		</div>
	</>
}

function NavItem (props: {label: string, page: PageKey}) {
	const {page, setPage} = useAppStore()
	const active = props.page === page
	const activeClasses = 'active'
	const inactiveClasses = ''

	return <li className={{}}>
		<a
			href={'#' + props.page}
			onClick={() => setPage(props.page)}
			className={'text-lg me-2 rounded ' + (active ? activeClasses : inactiveClasses)}
		>
			{props.label}
		</a>
	</li>
}

export default App;
