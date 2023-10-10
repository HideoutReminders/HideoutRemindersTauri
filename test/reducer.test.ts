import {test, expect} from "vitest";
import {defaultState, reducer} from "../src/lib/state";

test('reduce', () => {
	const state = defaultState()
	let updated = reducer(state, {
		type: 'SET_VOLUME',
		payload: 50,
	})
	expect(updated.settings.volume).eq(50);

	updated = reducer(updated, {
		type: 'SET_VOLUME',
		payload: 5,
	})
	expect(updated.settings.volume).eq(5);


	updated = reducer(updated, {
		type: 'SET_TTS_RANDOM',
		payload: true,
	})
	expect(updated.settings.volume).eq(5);
	expect(updated.settings.ttsVoiceRandom).eq(true);
	updated = reducer(updated, {
		type: 'SET_TTS_RANDOM',
		payload: false,
	})
	expect(updated.settings.volume).eq(5);
	expect(updated.settings.ttsVoiceRandom).eq(false);
})
