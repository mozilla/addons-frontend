import config from 'config';
import HotShots from 'hot-shots';
import expressResponseTime from 'response-time';

import log from 'amo/logger';

export const responseTime = ({
  _config = config,
  _log = log,
  _HotShots = HotShots,
} = {}) => {
  if (_config.get('datadogHost')) {
    const client = new _HotShots({
      host: _config.get('datadogHost'),
      port: _config.get('datadogPort'),
      // `NODE_CONFIG_ENV` contains the value of `%{::env}` in ops config
      // ('dev', 'stage' or 'prod').
      prefix: `addons-frontend-${process.env.NODE_CONFIG_ENV}.server.`,
    });

    client.socket.on('error', (error) => {
      _log.error(`statsd client socket error: ${error}`);
    });

    return expressResponseTime((req, res, time) => {
      // TODO: generate a key based on the rendered component, which I think is
      // in server/base.js -> match() -> renderProps.components

      client.increment(`response.${res.statusCode}`);
      client.increment(`response.${req.method}`);

      // The time variable is response time in milleseconds.
      const responseTimeKey = `response_time.${req.method}_${res.statusCode}`;
      client.timing(responseTimeKey, time);

      _log.debug(`response time: key=${responseTimeKey} value=${time}ms`);
    });
  }

  // When there is no host configured, we only log the time.
  return expressResponseTime((req, res, time) => {
    _log.debug(`response time: ${time}ms`);
  });
};
