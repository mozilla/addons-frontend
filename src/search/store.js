import { applyMiddleware, createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-async-connect';
import createLogger from 'redux-logger';

import search from 'search/reducers/search';
import addons from 'core/reducers/addons';

export default function createStore(initialData = {}) {
  return _createStore(
    combineReducers({addons, search, reduxAsyncConnect}),
    initialData,
    applyMiddleware(createLogger()),
  );
}
