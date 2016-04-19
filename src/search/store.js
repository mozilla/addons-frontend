import { applyMiddleware, createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-async-connect';
import createLogger from 'redux-logger';

import addons from 'core/reducers/addons';
import api from 'core/reducers/api';
import auth from 'core/reducers/authentication';
import search from 'search/reducers/search';

export default function createStore(initialState = {}) {
  return _createStore(
    combineReducers({addons, api, auth, search, reduxAsyncConnect}),
    initialState,
    applyMiddleware(createLogger()),
  );
}
