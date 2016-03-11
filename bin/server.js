#!/usr/bin/env node

/* eslint-disable strict, no-console*/

require('babel-register');

const config = require('config').default;
const appName = config.get('currentApp');
const env = config.get('env');

const port = env === 'production' ?
  config.get('serverPort') : config.get('devServerPort');
const host = env === 'production' ?
  config.get('serverHost') : config.get('devServerHost');

const WebpackIsomorphicTools = require('webpack-isomorphic-tools');
const WebpackIsomorphicToolsConfig = require('config/webpack-isomorphic-tools');

// Globals (these are set by definePlugin for client-side builds).
global.CLIENT = false;
global.SERVER = true;
global.DEVELOPMENT = env !== 'production';

// For reloading of the server on changes.
if (env === 'development') {
  if (!require('piping')({
    hook: true,
    ignore: /(\/\.|~$|\.json|\.scss$)/i,
  })) {
    return;
  }
}

global.webpackIsomorphicTools =
  new WebpackIsomorphicTools(WebpackIsomorphicToolsConfig)
  .development(env === 'development')
  .server(config.get('basePath'), (err) => {
    // Webpack Isomorphic tools is ready
    // now fire up the actual server.
    if (err) {
      console.log(err);
    }
    const server = require(`${appName}/server`).default;
    server.listen(port, host, (error) => {
      if (error) {
        console.error(err);
      }
      console.log(`🔥  Addons-frontend server is running [env:${env}]`);
      console.log(`👁  Open your browser at http://${host}:${port} to view it.`);
    });
  });
