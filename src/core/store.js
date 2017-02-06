/* global window */

import { applyMiddleware, compose } from 'redux';
import createLogger from 'redux-logger';
import config from 'config';

// HEY TOFUMATT THIS IS WHAT YOU WANT
const tofuWare = store => next => action => {
  const result = next(action);
  if (action.type === '@@router/LOCATION_CHANGE') {
    console.log('location change');
    console.log(action);
    store.dispatch({ type: 'CLEAR_ERROR_PAGE', payload: {} });
    store.dispatch({ type: '@redux-conn/CLEAR', payload: 'DetailPage' });
  }
  return result;
}
/*
 * Enhance a redux store with common middleware.
 *
 * This returns a function that takes a single argument, `createStore`,
 * and returns a new `createStore` function.
 */
export function middleware({
  _config = config, _createLogger = createLogger,
  _window = typeof window !== 'undefined' ? window : null,
} = {}) {
  if (_config.get('isDevelopment')) {
    return compose(
      applyMiddleware(tofuWare, _createLogger()),
      _window && _window.devToolsExtension ?
        _window.devToolsExtension() : (createStore) => createStore
    );
  }
  return compose(
    applyMiddleware(tofuWare),
    (createStore) => createStore
  );
}
