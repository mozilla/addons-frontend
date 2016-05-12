import { createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-async-connect';
import { middleware } from 'core/store';

import installations from 'disco/reducers/installations';

export default function createStore(initialState = {}) {
  return _createStore(
    combineReducers({installations, reduxAsyncConnect}),
    initialState,
    middleware(),
  );
}
