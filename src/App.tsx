import "./App.css";
import {useAppState} from "./lib/state";
import {useState} from "react";
import MainPage from "./pages/MainPage";
import {AppContextProvider} from "./lib/state";

function App () {
  const [state, dispatch] = useAppState()
	const [page, _setPage] = useState<'main' | 'setup' | 'settings'>('main')

	return <AppContextProvider value={{
		state,
		dispatch,
	}}>
		{page === 'main' && <MainPage />}
	</AppContextProvider>
}

export default App;
