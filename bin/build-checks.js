#!/usr/bin/env node
/* eslint-disable global-require, no-console */

const chalk = require('chalk');

require('babel-register');
const config = require('config');

const appName = config.get('appName');

// Bail if appName isn't set unless explicitly enabled.
if (!appName && process.env.ADDONS_FRONTEND_BUILD_ALL !== '1') {
  console.log(
    chalk.red('Please specify the appName with NODE_APP_INSTANCE'));
  process.exit(1);
}
