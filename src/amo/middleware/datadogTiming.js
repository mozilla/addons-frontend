import config from 'config';
import HotShots from 'hot-shots';
import responseTime from 'response-time';

import log from 'amo/logger';

export const datadogTiming = ({
  _config = config,
  _log = log,
  _HotShots = HotShots,
} = {}) => {
  // We aren't adding any global DataDog tags here because we already
  // get a few automatically. They are configured at the EC2 instance
  // level. For example: env:dev, env:stage, or env:production
  const client = new _HotShots({
    host: _config.get('datadogHost'),
    port: _config.get('datadogPort'),
    prefix: 'addons_frontend.server.',
  });

  client.socket.on('error', (error) => {
    // Log an error to Sentry.
    _log.error(`DataDog client socket error: ${error}`);
    // Log the full stack trace too:
    // eslint-disable-next-line amo/only-log-strings
    _log.error('%o', { err: error });
  });

  return responseTime((req, res, time) => {
    // TODO: generate a key based on the rendered component, which
    // I think is in server/base.js -> match() -> renderProps.components

    client.increment(`response_code.${res.statusCode}.count`);

    const responseTypeKey = `response.${req.method}`;
    client.increment(`${responseTypeKey}.count`);
    // The time variable is response time in milleseconds.
    client.timing(`${responseTypeKey}.time`, time);
  });
};
