#!/usr/bin/env node
/* eslint-disable global-require, no-console */

const chalk = require('chalk');
require('babel-register');
const config = require('config');

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

require('core/server/base').runServer();
