#!/usr/bin/env node

/* eslint-disable no-console */
/* eslint-disable prefer-template */

// A simple check that node + npm versions
// meet the expected minimums.

var exec = require('shelljs').exec;
var chalk = require('chalk');
var semver = require('semver');

const MIN_NODE_VERSION = 4;
const MIN_NPM_VERSION = 3;

const NODE_VERSION = process.versions.node;
const NPM_VERSION = exec('npm --version', {silent: true}).output;

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
