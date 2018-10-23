import config from 'config';

import { AMO_REQUEST_ID_HEADER } from 'core/constants';

let pino = null;
let httpContext = null;
if (process.env.NODE_ENV === 'test') {
  // We explicitely require the "browser" (client) version of Pino to write
  // logs with `console` and not `stdout` so that Jest can handle the output.
  // See: https://github.com/mozilla/addons-frontend/issues/5869
  //
  // eslint-disable-next-line global-require
  pino = require('pino/browser');
} else {
  // Pino is an isomorphic logging library and works well on both the server
  // and the client without configuration.
  //
  // eslint-disable-next-line global-require
  pino = require('pino');
}

const pinoLogger = pino({
  level: config.get('loggingLevel'),
  name: config.get('appName'),
});

if (config.get('enableRequestID')) {
  // eslint-disable-next-line global-require
  httpContext = require('express-http-context');

  if (typeof httpContext.get !== 'function') {
    // Set the `httpContext` to `null` so that it does not need an extra check
    // on the browser.
    httpContext = null;
  }
}

export default ['debug', 'error', 'fatal', 'info', 'trace', 'warn'].reduce(
  (decoratedLogger, level) => {
    return {
      ...decoratedLogger,
      [level]: (...args) => {
        const requestId = httpContext && httpContext.get(AMO_REQUEST_ID_HEADER);

        if (requestId) {
          pinoLogger[level]({ amo_request_id: requestId }, ...args);
        } else {
          pinoLogger[level](...args);
        }
      },
    };
  },
  {},
);
