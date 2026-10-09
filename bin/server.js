#!/usr/bin/env node

require('@babel/register')({
  plugins: ['dynamic-import-node'],
});

if (process.env.NODE_ENV === 'development') {
  if (process.env.USE_HTTPS_FOR_DEV) {
    // Skip SSL check to avoid the 'self signed certificate in certificate
    // chain' error.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
}

require('amo/server/base').runServer();
