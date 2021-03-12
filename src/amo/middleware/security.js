import helmet from 'helmet';
import config from 'config';
import deepcopy from 'deepcopy';

import log from 'amo/logger';
import { ONE_YEAR_IN_SECONDS } from 'amo/constants';

export function frameguard({ _config = config } = {}) {
  return helmet.frameguard(_config.get('frameGuard'));
}

export function csp({ _config = config, _log = log } = {}) {
  const cspConfig =
    _config.get('CSP') !== 'false' ? deepcopy(_config.get('CSP')) : false;

  if (cspConfig) {
    return helmet.contentSecurityPolicy(cspConfig);
  }

  return (req, res, next) => {
    _log.warn('CSP has been disabled from the config');
    next();
  };
}

export function hsts() {
  return helmet.hsts({
    force: true,
    includeSubDomains: false,
    maxAge: ONE_YEAR_IN_SECONDS,
  });
}
