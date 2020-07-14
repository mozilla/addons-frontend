/* global window */
import config from 'config';
import { applyMiddleware, compose } from 'redux';
import { createLogger } from 'redux-logger';

import log from 'core/logger';

export const minimalReduxLogger = () => (next) => (action) => {
  log.info(`Dispatching ${action.type}`);
  return next(action);
};

/*
 * Enhance a redux store with common middleware.
 *
 * This returns a function that takes a single argument, `createStore`,
 * and returns a new `createStore` function.
 */
export function middleware({
  _applyMiddleware = applyMiddleware,
  _config = config,
  _createLogger = createLogger,
  _minimalReduxLogger = minimalReduxLogger,
  _window = typeof window !== 'undefined' ? window : null,
  sagaMiddleware = null,
  routerMiddleware = null,
} = {}) {
  const isDev = _config.get('isDevelopment');

  const callbacks = [];
  if (isDev) {
    // Log all Redux actions but only when in development.
    if (_config.get('server')) {
      // Use a minimal logger while on the server.
      callbacks.push(_minimalReduxLogger);
    } else {
      // Use the full logger while on the client.
      callbacks.push(_createLogger());
    }
  }
  if (sagaMiddleware) {
    callbacks.push(sagaMiddleware);
  }
  if (routerMiddleware) {
    callbacks.push(routerMiddleware);
  }

  return compose(
    _applyMiddleware(...callbacks),
    _config.get('enableDevTools') &&
      _window &&
      _window.__REDUX_DEVTOOLS_EXTENSION__
      ? _window.__REDUX_DEVTOOLS_EXTENSION__()
      : (createStore) => createStore,
  );
}
