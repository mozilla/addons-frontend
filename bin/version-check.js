#!/usr/bin/env node

// eslint messages suppressed to allow this to work
// in older node versions.

/* eslint-disable strict */
/* eslint-disable no-var */
/* eslint-disable no-console */
/* eslint-disable prefer-template */

'use strict';

// A simple check that node + npm versions
// meet the expected minimums.

var { exec } = require('shelljs');
var chalk = require('chalk');
var semver = require('semver');

var MIN_NODE_VERSION = 6;
var MIN_NPM_VERSION = 3;

var NODE_VERSION = process.versions.node;
var NPM_VERSION = exec('npm --version', { silent: true }).stdout;

var versionCheckPassed = true;

if (semver.major(NODE_VERSION) < MIN_NODE_VERSION) {
  console.log(chalk.red('Node version must be at least: ' + MIN_NODE_VERSION));
  versionCheckPassed = false;
}

if (semver.major(NPM_VERSION) < MIN_NPM_VERSION) {
  console.log(chalk.red('NPM version must be at least: ' + MIN_NPM_VERSION));
  versionCheckPassed = false;
}

if (versionCheckPassed === false) {
  process.exit(1);
}
