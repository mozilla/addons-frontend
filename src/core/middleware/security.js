import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

import helmet from 'helmet';
import config from 'config';

import log from 'core/logger';

export function frameguard({ _config = config } = {}) {
  return helmet.frameguard(_config.get('frameGuard'));
}

export function getNoScriptStyles(
  appName,
  { _config = config, _log = log } = {},
) {
  const cssPath = path.join(
    _config.get('basePath'),
    `src/${appName}/noscript.css`,
  );
  try {
    return fs.readFileSync(cssPath);
  } catch (e) {
    if (e.code !== 'ENOENT') {
      _log.info(`noscript styles could not be parsed from ${cssPath}`);
    } else {
      _log.debug(`noscript styles not found at ${cssPath}`);
    }
  }
  return undefined;
}

export function csp({ _config = config, noScriptStyles, _log = log } = {}) {
  const cspConfig = _config.get('CSP') !== 'false' ? _config.get('CSP') : false;

  if (cspConfig) {
    if (noScriptStyles) {
      const hash = crypto
        .createHash('sha256')
        .update(noScriptStyles)
        .digest('base64');
      const cspValue = `'sha256-${hash}'`;
      if (
        cspConfig.directives &&
        !cspConfig.directives.styleSrc.includes(cspValue)
      ) {
        cspConfig.directives.styleSrc.push(cspValue);
      }
    }
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
    maxAge: 31536000, // seconds
  });
}
