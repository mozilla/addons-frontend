import { createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-async-connect';

import { middleware } from 'core/store';
import addons from 'core/reducers/addons';
import api from 'core/reducers/api';

export default function createStore(initialState = {}) {
  return _createStore(
    combineReducers({ addons, api, reduxAsyncConnect }),
    initialState,
    middleware(),
  );
}
