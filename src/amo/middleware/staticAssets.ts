import path from 'path';

import config from 'config';
import Express from 'express';

export function serveAssetsLocally({
  _config = config,
} = {}) {
  return Express.static(path.join(_config.get('basePath'), 'dist', 'static'));
}