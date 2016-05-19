import { createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-async-connect';
import { middleware } from 'core/store';

import addons from 'core/reducers/addons';
import fakeData from 'disco/fakeData';
import installations from 'disco/reducers/installations';

export default function createStore(initialState = {}) {
  const state = {...initialState, ...fakeData};
  return _createStore(
    combineReducers({addons, installations, reduxAsyncConnect}),
    state,
    middleware(),
  );
}
