#!/usr/bin/env node

require('../server.babel');

const server = require('../src/server').default;
const config = require('../config').default;

const port = config.get('serverPort');
const host = config.get('serverHost');
const env = config.get('env');

server.listen(port, host);
// eslint-disable-next-line no-console
console.log(`Express server listening: ${host}:${port} [env:${env}]`);
