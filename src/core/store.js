import { applyMiddleware, compose } from 'redux';
import createLogger from 'redux-logger';
import config from 'config';

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
      applyMiddleware(_createLogger()),
      _window && _window.devToolsExtension ?
        _window.devToolsExtension() : (createStore) => createStore
    );
  }
  return (createStore) => createStore;
}
