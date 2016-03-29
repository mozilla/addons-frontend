#!/usr/bin/env node

require('babel-register');
const config = require('config').default;
const env = config.get('env');

if (env === 'development') {
  if (!require('piping')({
    hook: true,
    ignore: /(\/\.|~$|\.json|\.scss$)/i,
  })) {
    return;
  }
}

require('core/server/base').runServer();
