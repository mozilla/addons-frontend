import config from 'config';

import { AMO_REQUEST_ID_HEADER, APP_NAME } from 'core/constants';

let pino = null;
let httpContext = null;
let nanoSeconds = null;
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

if (config.get('enableRequestID')) {
  // eslint-disable-next-line global-require
  httpContext = require('express-http-context');
}

if (config.get('server')) {
  // eslint-disable-next-line global-require
  nanoSeconds = require('nano-time');
}

const pinoLogger = pino({
  level: config.get('loggingLevel'),
  name: APP_NAME,
  // That is how the upstream library implements this... See:
  // https://github.com/pinojs/pino/blob/220e3d019fe22167a59cfe26260f6c2b4d0ea22b/lib/time.js#L5
  // Note: `true` is the default value for this parameter.
  timestamp: nanoSeconds ? () => `,"time":${nanoSeconds()}` : true,
});

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
