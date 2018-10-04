/* @flow */
import { createBrowserHistory } from 'history';
import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';

import createStore from 'amo/store';
import { addQueryParamsToHistory } from 'core/utils';

const history = addQueryParamsToHistory({
  history: createBrowserHistory(),
});

const { store } = createStore({ history });

export default function Provider({ story }: Object) {
  return <ReduxProvider store={store}>{story}</ReduxProvider>;
}
