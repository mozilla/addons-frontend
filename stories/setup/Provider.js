import React from 'react';

// Without core/polyfill we see the following error:
// "regeneratorRuntime is not defined".
import 'core/polyfill';
import { createBrowserHistory } from 'history';
import { Provider as ReduxProvider } from 'react-redux';

import createStore from 'amo/store';
import { setClientApp, setLang, setUserAgent } from 'core/actions';
import { addQueryParamsToHistory } from 'core/utils';

// export default createBrowserHistory();
const history = addQueryParamsToHistory({
	history: createBrowserHistory(),
});

const { store } = createStore({ history });

store.dispatch(setClientApp('firefox'));
store.dispatch(setLang('en-US'));
store.dispatch(
	setUserAgent(
		'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:40.0) Gecko/20100101 Firefox/40.1',
	),
);

export default function Provider({ story }) {
	return <ReduxProvider store={store}>{story}</ReduxProvider>;
}
