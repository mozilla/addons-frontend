import config from 'config';
import HotShots from 'hot-shots';
import responseTime from 'response-time';

import log from 'amo/logger';

export const datadogTiming = ({
  _config = config,
  _log = log,
  _HotShots = HotShots,
} = {}) => {
  if (_config.get('datadogHost')) {
    const client = new _HotShots({
      host: _config.get('datadogHost'),
      port: _config.get('datadogPort'),
      prefix: 'addons_frontend.server.',
    });

    client.socket.on('error', (error) => {
      _log.error(`statsd client socket error: ${error}`);
    });

    return responseTime((req, res, time) => {
      // TODO: generate a key based on the rendered component, which I think is
      // in server/base.js -> match() -> renderProps.components

      client.increment(`response_code.${res.statusCode}.count`);

      const responseTypeKey = `response.${req.method}`;
      client.increment(`${responseTypeKey}.count`);
      // The time variable is response time in milleseconds.
      client.timing(`${responseTypeKey}.time`, time);

      _log.info(`response time: key=${responseTypeKey}.time value=${time}ms`);
    });
  }

  // When there is no host configured, we only log the time.
  return responseTime((req, res, time) => {
    _log.info(`response time: ${time}ms`);
  });
};
