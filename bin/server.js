#!/usr/bin/env node
/* eslint-disable global-require, no-console */
const path = require('path');

const chalk = require('chalk');
const chokidar = require('chokidar');
require('babel-register');
const config = require('config');
const touch = require('touch');

const appName = config.get('appName');

if (!appName) {
  console.log(
    chalk.red('Please specify the appName with NODE_APP_INSTANCE'));
  process.exit(1);
}

if (config.util.getEnv('NODE_ENV') === 'development') {
  if (!require('piping')({
    hook: true,
    ignore: /(\/\.|~$|\.json|\.scss$)/i,
  })) {
    return;
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
