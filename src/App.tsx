import "./App.css";
import {defaultState, useAppState} from "./lib/state";
import {createContext, useState} from "react";
import MainPage from "./pages/MainPage";
import {Dispatch, State} from "./types/types";

function App () {
  const [state, dispatch] = useAppState()
	const [page, _setPage] = useState<'main' | 'setup' | 'settings'>('main')

	return <AppContext.Provider value={{
		state,
		dispatch,
	}}>
		{page === 'main' && <MainPage state={state} dispatch={dispatch} />}
	</AppContext.Provider>
}

export default App;
