import {useAppStore} from "../lib/store";
import {ReactNode, useEffect, useRef, useState} from "react";
import {open} from '@tauri-apps/api/dialog';
import {Settings} from "../types/types";
import TimeAgo from "../components/TimeAgo";
import SVGIcon from "../components/SVGIcon";
import Card from "../components/Card";
import {saveSettingsJSONFile} from "../lib/settings";

type VoiceOption = {
	label: string
	value: number
}

export default function SettingsPage () {
	const {settings, setSettings, addError, errors} = useAppStore()
	const [volume, setVolume] = useState<number>(settings.volume)
	const [clientTxt, setClientTxt] = useState<string | undefined>(settings.poeClientTxtPath)
	const [ttsVoice, setTTSVoice] = useState<number>(settings.ttsVoiceIdx)
	const [voices, setVoices] = useState<VoiceOption[]>([])
	const volChangeRef = useRef<NodeJS.Timeout | null>(null)
	const clientTxtChangeRef = useRef<NodeJS.Timeout | null>(null)
	const clientTxtErrors = errors.some(x => x.context === 'poe_status')

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
		function onVoicesChanged () {
			const voices = speechSynthesis.getVoices();
			console.log('got voices', voices)
			setVoices(voices.map((v, idx) => {
				return {
					label: v.name + ' (' + v.lang + ')' + (v.default ? ' DEFAULT' : ''),
					value: idx,
				}
			}))
		}
		speechSynthesis.onvoiceschanged = onVoicesChanged
		onVoicesChanged()

		return () => {
			speechSynthesis.onvoiceschanged = null
		}
	}, [])

	async function clickBrowseFiles () {
		const selected = await open({
			multiple: false,
			defaultPath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Path of Exile\\logs',
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
		saveSettings({
			...settings,
			poeClientTxtPath: newTxt,
		})
	}

	function previewVoice (idx: number) {
		let utterance = new SpeechSynthesisUtterance();

		// Set the text and voice of the utterance
		utterance.text = 'this is sample text';
		utterance.voice = window.speechSynthesis.getVoices()[idx];
		utterance.volume = volume/100

		// Speak the utterance
		window.speechSynthesis.speak(utterance);
	}

	function clickTTSVoice (idx: number) {
		setTTSVoice(idx)
		saveSettings({
			...settings,
			ttsVoiceIdx: idx,
		})
	}

	async function saveSettings (newSettings: Settings) {
		const toSave : Settings = {
			...newSettings,
			default: false,
			lastSavedAt: new Date(),
		}
		saveSettingsJSONFile(toSave).catch((err) => {
			addError({
				key: 'save_settings',
				context: 'settings_save',
				message: err.toString(),
			})
		}).then(() => {
			setSettings(toSave)
		})
	}

	return <div className={'pb-4'}>
		<div className={'px-5 pb-1 mt-4 flex justify-end text-gray-500'}>
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
							saveSettings({
								...settings,
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
	</div>
}


type FormGroupProps = {
	children: ReactNode,
	label: string
	description?: string
}
function FormGroup ({children, label, description}: FormGroupProps) {
	return <Card className={'form-control mb-8 mt-0'}>
		<label className="label">
			<span className="label-text font-bold text-lg">{label}</span>
		</label>
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
