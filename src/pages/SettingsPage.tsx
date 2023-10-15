import {AppStorage, useAppStore} from "../lib/store";
import {useEffect, useRef, useState} from "react";
import { open } from '@tauri-apps/api/dialog';
import {Settings} from "../types/types";

type VoiceOption = {
	label: string
	value: number
}

export default function SettingsPage () {
	const {settings, setSettings} = useAppStore()
	const [volume, setVolume] = useState<number>(settings.volume)
	const [clientTxt, setClientTxt] = useState<string | undefined>(settings.clientTxt)
	const [ttsVoice, setTTSVoice] = useState<number>(settings.ttsVoice)
	const [voices, setVoices] = useState<VoiceOption[]>([])
	const volChangeRef = useRef<number>(0)

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

	function submit (e: React.FormEvent) {
		e.preventDefault()
		save()
	}

	function save () {
		const newSettings : Settings = {
			...settings,
			volume,
			ttsVoice,
			clientTxt: clientTxt || '',
		}
		setSettings(newSettings)
		AppStorage.set('settings', newSettings)
	}

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
			// TODO: Use rust to verify that this path loads some stuff before saving it
			// and throw an error probably if it isn't a valid file
			setClientTxt(selected)
			setSettings({
				...settings,
				clientTxt: selected,
			})
		}
	}

	function previewVoice (idx: number) {
		let utterance = new SpeechSynthesisUtterance();

		// Set the text and voice of the utterance
		utterance.text = 'this is sample text';
		utterance.voice = window.speechSynthesis.getVoices()[idx];

		// Speak the utterance
		window.speechSynthesis.speak(utterance);
	}

	function clickTTSVoice (idx: number) {
		setTTSVoice(idx)
		setSettings({
			...settings,
			ttsVoice: idx,
		})
	}

	return <div className={'p-4'}>
		<h1>Settings</h1>
		<form onSubmit={submit}>
			<FormGroup label={`Path of Exile Client.txt Location`} description={'The log file is read to determine where you are.'}>
				<div className={'join w-full'}>
					<input
						type={'text'}
						value={clientTxt}
						className={'input input-bordered w-full join-item text-sm'}
						onChange={(e) => setClientTxt(e.target.value)}
					/>
					<button type={'button'} onClick={clickBrowseFiles} className={'btn btn-primary join-item'}>Browse Files</button>
				</div>
			</FormGroup>
			<FormGroup label={`Volume (${volume}%)`}>
				<input
					type="range"
					min={0}
					max="100"
					value={volume}
					onChange={(e) => {
						clearTimeout(volChangeRef.current)
						const vol = parseInt(e.target.value)
						setVolume(vol)
						volChangeRef.current = setTimeout(() => {
							setSettings({
								...settings,
								volume: vol,
							})
						}, 100)
					}}
					className="range"
					style={{maxWidth: '300px'}}
				/>
			</FormGroup>
			<FormGroup label={'Voice'}>
				{!voices.length && <div>No voices found.</div>}
				{voices.map((v) => {
					return <div key={v.value} className={'join w-full flex mb-2'}>
						<button type={'button'} onClick={() => {
							clickTTSVoice(v.value)
						}} className={'flex-1 justify-start join-item btn btn-sm ' + (ttsVoice === v.value ? ' btn-accent' : 'btn-outline')}>
							{v.label}
						</button>
						<button type={'button'} className={'flex-none join-item btn-sm btn-outline btn'} onClick={() => previewVoice(v.value)}>
							Preview
						</button>
					</div>
				})}
			</FormGroup>
		</form>
	</div>
}

function FormGroup ({children, label, description}) {
	return <div className={'form-control mb-4'}>
		<label className="label">
			<span className="label-text font-bold text-lg">{label}</span>
		</label>
		<div>
			{children}
		</div>
		{description && <label className="label">
			<span className="label-text text-sm">{description}</span>
		</label>}
	</div>
}
