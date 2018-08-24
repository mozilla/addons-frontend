import React from 'react';

// Without core/polyfill we see the following error:
// "regeneratorRuntime is not defined".
import 'core/polyfill';

import { addQueryParamsToHistory } from '../src/core/utils';
import { createBrowserHistory } from 'history';
// export default createBrowserHistory();
const history = addQueryParamsToHistory({
  history: createBrowserHistory(),
});
import { Provider as ReduxProvider } from 'react-redux';
import createStore from '../src/amo/store';

// TODO: look into why stote/state isn't seen
// by Button for example when you use the "to" prop:
// it complains about the following (missing) clientApp and lang props :/
// Do we need to add it to html and get it that way..? maybe preview-head.html?
// The below only handles the Link url issue noted above.
let initialState;
const { store } = createStore({
  history,
  initialState: {
    api: {
      clientApp: 'firefox',
      lang: 'en-US',
    },
  },
});

export default function Provider({ story }) {
  return <ReduxProvider store={store}>{story}</ReduxProvider>;
}
