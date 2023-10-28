import {useAppStore} from "../lib/store";
import {ReactNode, useEffect, useRef, useState} from "react";
import {open} from '@tauri-apps/api/dialog';
import {Settings} from "../types/types";
import TimeAgo from "../components/TimeAgo";
import SVGIcon from "../components/SVGIcon";
import Card from "../components/Card";
import usePlayTTS from "../hooks/use-play-tts";
import {getVoices} from "../lib/helpers";
import {POE_CLIENT_TXT_DIRS, POE_SAFE_ZONES} from "../lib/poe";

type VoiceOption = {
	label: string
	value: number
}

const sampleText = 'this is some sample text'
export default function SettingsPage () {
	const appStore = useAppStore()
	const {settings, saveSettings, errors, get} = appStore
	const [volume, setVolume] = useState<number>(settings.volume)
	const [safeZones, setSafeZones] = useState<string>('')
	const [clientTxt, setClientTxt] = useState<string | undefined>(settings.poeClientTxtPath)
	const [ttsVoice, setTTSVoice] = useState<number>(settings.ttsVoiceIdx)
	const [voices, setVoices] = useState<VoiceOption[]>([])
	const volChangeRef = useRef<NodeJS.Timeout | null>(null)
	const safeZonesRef = useRef<NodeJS.Timeout | null>(null)
	const clientTxtChangeRef = useRef<NodeJS.Timeout | null>(null)
	const clientTxtErrors = errors.some(x => x.context === 'poe_status')
	const play = usePlayTTS()

	useEffect(() => {
		setSafeZones((settings.safeZoneNames || []).join('\n'))
	}, [`${settings.safeZoneNames}`])

	useEffect(() => {
		setVolume(settings.volume)
	}, [settings.volume])

	useEffect(() => {
		setClientTxt(settings.poeClientTxtPath)
	}, [settings.poeClientTxtPath])

	useEffect(() => {
		setTTSVoice(settings.ttsVoiceIdx)
	}, [settings.ttsVoiceIdx])

	useEffect(() => {
		getVoices().then((voices) => {
			console.log('voices', voices)
			setVoices(voices.map((v, idx) => {
				return {
					label: v.name + ' (' + v.lang + ')' + (v.default ? ' DEFAULT' : ''),
					value: idx,
				}
			}))
		})
	}, [])

	async function clickBrowseFiles () {
		const selected = await open({
			multiple: false,
			defaultPath: POE_CLIENT_TXT_DIRS[0],
			filters: [{
				name: 'Client Txt',
				extensions: ['txt']
			}]
		}) as string;
		console.log('selected', selected)
		if (selected) {
			saveClientTxt(selected)
		}
	}

	function saveClientTxt (newTxt: string) {
		updateSettings({
			poeClientTxtPath: newTxt,
		})
	}

	function previewVoice (idx: number) {
		play.playText(sampleText, undefined, {
			...settings,
			ttsVoiceIdx: idx,
		})
	}

	function clickTTSVoice (idx: number) {
		setTTSVoice(idx)
		updateSettings({
			ttsVoiceIdx: idx,
		})
	}

	async function updateSettings (updates: Partial<Settings>) {
		const {settings} = get()
		const toSave : Settings = {
			...settings,
			...updates,
			default: false,
			lastSavedAt: new Date(),
		}
		saveSettings(toSave)
	}

	return <div className={'pb-4 relative'}>
		<div className={'px-5 pb-1 mt-4 top-0 bg-black flex justify-end text-gray-500 sticky'}>
			<span className={'text-sm'}>
				Last saved{" "}
				{settings.lastSavedAt ? <><TimeAgo date={settings.lastSavedAt} /></> : <em>never</em>}
			</span>
		</div>
		<FormGroup label={`Path of Exile Client.txt Location`} description={'The log file is checked to get your PoE location.'}>
			<div className={'join w-full'}>
				<input
					type={'text'}
					value={clientTxt}
					className={'input input-bordered w-full join-item text-sm '  + (clientTxtErrors ? 'border-error' : '')}
					onChange={(e) => {
						setClientTxt(e.target.value)
						clearTimeout(clientTxtChangeRef.current as NodeJS.Timeout)
						clientTxtChangeRef.current = setTimeout(() => {
							console.log('save that ish')
							saveClientTxt(e.target.value)
						}, 500)
					}}
				/>
				<button type={'button'} onClick={clickBrowseFiles} className={'btn btn-primary join-item no-animation'}>Browse Files</button>
			</div>
		</FormGroup>

		<FormGroup label={`Volume (${volume}%)`}>
			<div className={'flex items-center'}>
				<input
					type="range"
					min={0}
					max="100"
					value={volume}
					onChange={(e) => {
						if (volChangeRef.current !== null) {
							clearTimeout(volChangeRef.current as NodeJS.Timeout)
						}
						const vol = parseInt(e.target.value)
						setVolume(vol)
						volChangeRef.current = setTimeout(() => {
							updateSettings({
								volume: vol,
							})
						}, 100)
					}}
					className="range range-primary range-xs"
				/>
				<PlayButton onClick={() => previewVoice(ttsVoice)} className={'ms-4'} />

			</div>
		</FormGroup>
		<FormGroup label={'Voice'}>
			{!voices.length && <div>No voices found.</div>}
			{voices.map((v) => {
				return <div key={v.value} className={'join w-full flex mb-2'}>
					<button type={'button'} onClick={() => {
							clickTTSVoice(v.value)
						}}
						className={'animate-none flex-1 justify-start join-item btn btn-sm ' + (ttsVoice === v.value ? ' btn-accent' : 'btn-outline')}
					>
						{v.label}
					</button>
					<PlayButton onClick={() => previewVoice(v.value)} className={'join-item'} />
				</div>
			})}
		</FormGroup>
		<FormGroup
			label={'Safe Zones'}
			description={'One per line'}
			labelExtra={<button
				type={'button'}
				onClick={() => {
					console.log('save to wahtver')
					updateSettings({
						safeZoneNames: POE_SAFE_ZONES,
					})
				}}
				className={'btn btn-neutral btn-sm'}>
					Restore Defaults
				</button>
			}
		>
			<textarea className={'textarea textarea-bordered w-full h-64'} value={safeZones} onChange={(e) => {
				if (safeZonesRef.current !== null) {
					clearTimeout(safeZonesRef.current as NodeJS.Timeout)
				}
				setSafeZones(e.target.value)
				safeZonesRef.current = setTimeout(() => {
					const zoneLines = e.target.value.split('\n')
					const zones = zoneLines.map((x, idx) => {
						if (idx === zoneLines.length - 1) {
							return x
						}
						return x.trim()
					})
					updateSettings({
						...settings,
						safeZoneNames: zones,
					})
					setSafeZones(zones.join('\n'))
				}, 500)}
			}>
			</textarea>
		</FormGroup>
	</div>
}


type FormGroupProps = {
	children: ReactNode,
	label: string
	labelExtra?: ReactNode
	description?: string
}
function FormGroup ({children, label, labelExtra, description}: FormGroupProps) {
	return <Card className={'form-control mb-8 mt-0'}>
		<div className={' ' + (labelExtra ? 'flex items-center justify-between' : 'content-start')}>
			<label className="label">
				<span className="label-text font-bold text-lg">{label}</span>
			</label>
			{labelExtra && labelExtra}
		</div>
		<div>
			{children}
		</div>
		{description && <label className="label">
			<span className="label-text text-sm">{description}</span>
		</label>}
	</Card>
}

export function PlayButton ({onClick, className} : {onClick: Function, className: string}) {
	return <button type={'button'} className={'animate-none flex-none join-item btn-sm btn-outline btn ' + className} onClick={() => onClick()}>
		<SVGIcon type={'play'} className={'w-5 h-5'} />
		Preview
	</button>
}
