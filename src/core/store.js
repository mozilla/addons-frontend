import { applyMiddleware } from 'redux';
import createLogger from 'redux-logger';
import config from 'config';

export function middleware({ __config = config } = {}) {
  if (__config.get('isDevelopment')) {
    return applyMiddleware(createLogger());
  }
  return undefined;
}
