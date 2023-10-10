import {Dispatch, State} from "../types/types";
import {promptToReminder} from "../lib/reminders";
import {useState} from "react";
import CreateReminder from "../components/CreateReminder";

export type PageProps = {
	state: State,
	dispatch: Dispatch
}

export default function MainPage (props: PageProps) {
	const {state, dispatch} = props


	return <div>
		<div>
			<CreateReminder />
			<div>
				Your should go here
			</div>
		</div>
		<div>
			<h2>Upcoming</h2>
			{state.reminders.map((r) => {
				return <div key={r.id}>{r.text} @ {r.playAfter}</div>
			})}
		</div>
	</div>
}
