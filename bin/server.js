#!/usr/bin/env node

require('babel-register');
const config = require('config');

if (config.util.getEnv('NODE_ENV') === 'development') {
  if (!require('piping')({
    hook: true,
    ignore: /(\/\.|~$|\.json|\.scss$)/i,
  })) {
    return;
  }
}

require('core/server/base').runServer();
