/* global window */

import { applyMiddleware, compose } from 'redux';
import { loadingBarMiddleware } from 'react-redux-loading-bar';
import { createLogger } from 'redux-logger';
import config from 'config';


// These are the actions the loading indicator will respond to for showing
// or hiding the loading bar.
// These are existing reduxConnect actions that we hook into to dispatch
// the loading bar actions.
// This can probably go away when we move to something like redux-saga.
const PROMISE_PREFIXES = {
  promiseTypeSuffixes: [
    // Dispatching this action shows the loading bar and starts its animation.
    'BEGIN_GLOBAL_LOAD',
    // Dispatching either of the following actions stop/hide the loading bar.
    'END_GLOBAL_LOAD',
    'LOAD_FAIL',
  ],
};

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
      applyMiddleware(
        _createLogger(),
        loadingBarMiddleware(PROMISE_PREFIXES),
      ),
      _window && _window.devToolsExtension ?
        _window.devToolsExtension() : (createStore) => createStore
    );
  }

  return compose(
    applyMiddleware(
      loadingBarMiddleware(PROMISE_PREFIXES),
    ),
    (createStore) => createStore,
  );
}
