#!/usr/bin/env node
/* eslint-disable global-require, no-console */

const chalk = require('chalk');
require('@babel/register');
const config = require('config');

const appName = config.get('appName');

// Bail if appName isn't set.
if (!appName) {
  console.log(chalk.red('appName not set in config'));
  process.exit(1);
}

console.log(chalk.green(`\n--->  BUILDING: ${appName}\n`));
