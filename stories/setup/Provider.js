/* @flow */
import { createBrowserHistory } from 'history';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

// Without core/polyfill we see the following error:
// "regeneratorRuntime is not defined".
import 'core/polyfill';
import createStore from 'amo/store';
import { addQueryParamsToHistory } from 'core/utils';

const history = addQueryParamsToHistory({
  history: createBrowserHistory(),
});

const { store } = createStore({ history });

export default function Provider({ story }: Object) {
  return <ReduxProvider store={store}>{story}</ReduxProvider>;
}
