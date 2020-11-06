#!/usr/bin/env node
/* eslint-disable global-require, no-console */
const path = require('path');

const chokidar = require('chokidar');
require('@babel/register')({
  plugins: ['dynamic-import-node'],
});
const config = require('config');
const touch = require('touch');

if (process.env.NODE_ENV === 'development') {
  if (!require('piping')({
    hook: true,
    ignore: /(\/\.|~$|\.json|\.scss$)/i,
  })) {
    return;
  }

  if (process.env.USE_HTTPS_FOR_DEV) {
    // Skip SSL check to avoid the 'self signed certificate in certificate
    // chain' error.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

require('core/server/base').runServer().then(() => {
  if (config.get('isDevelopment')) {
    const basePath = config.get('basePath');
    const watcher = chokidar.watch(path.join(basePath, 'src'));

    watcher.on('ready', () => {
      console.log('👀 The file watcher for server hot reload is ready.');

      watcher.on('all', () => {
        // Touching this file triggers a server reload.
        touch.sync(__filename);
      });
    });
  }
});
