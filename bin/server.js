#!/usr/bin/env node

require('../server.babel');

const config = require('../config').default;
const appName = config.get('currentApp');

const server = require(`../src/${appName}/server`).default;

const env = config.get('env');

const port = env === 'production' ?
  config.get('serverPort') : config.get('devServerPort');
const host = env === 'production' ?
  config.get('serverHost') : config.get('devServerHost');

server.listen(port, host);

// eslint-disable-next-line no-console
console.log(`Express server listening: ${host}:${port} [env:${env}]`);
