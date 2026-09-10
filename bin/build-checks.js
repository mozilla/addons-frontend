#!/usr/bin/env node
/* eslint-disable global-require, no-console */

const util = require('node:util');
require('@babel/register');

console.log(util.styleText('green', `\n--->  BUILDING app\n`));
