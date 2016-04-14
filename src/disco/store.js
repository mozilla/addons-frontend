import { applyMiddleware, createStore as _createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-async-connect';
import createLogger from 'redux-logger';

export default function createStore(initialState = {}) {
  return _createStore(
    combineReducers({reduxAsyncConnect}),
    initialState,
    applyMiddleware(createLogger()),
  );
}
