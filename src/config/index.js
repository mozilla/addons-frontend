import path from 'path';
const config = new Map();

/* istanbul ignore next */
// Looks like you can't ignore a file but you can ignore a function, we don't want coverage here.
(function defineConfig() {
  const NODE_ENV = process.env.NODE_ENV;

  // Default to production unless overridden.
  config.set('env', NODE_ENV || 'production');

  config.set('basePath', path.resolve(__dirname, '../'));

  // This is the host / port for running as production.
  config.set('serverHost', process.env.SERVER_HOST || '127.0.0.1');
  config.set('serverPort', process.env.SERVER_PORT || 4000);

  // This is the host / port for the development instance.
  config.set('devServerHost', process.env.SERVER_HOST || '127.0.0.1');
  config.set('devServerPort', process.env.SERVER_PORT || 3000);

  // This is the host / port for the webpack dev server.
  config.set('webpackServerHost', process.env.WEBPACK_SERVER_HOST || '127.0.0.1');
  config.set('webpackServerPort', process.env.WEBPACK_SERVER_PORT || 3001);

  config.set('apiHost',
    process.env.API_HOST ||
      (NODE_ENV === 'development' ?
        'https://addons-dev.allizom.org' : 'https://addons.mozilla.org'));

  config.set('apiPath', process.env.API_PATH || '/api/v3');
  config.set('apiBase', config.get('apiHost') + config.get('apiPath'));

  config.set('startLoginUrl', `${config.get('apiHost')}/api/v3/internal/accounts/login/start/`);

  const CSP = {
    directives: {
      connectSrc: ["'self'", config.get('apiHost')],
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      reportUri: '/__cspreport__',
    },

    // Set to true if you only want browsers to report errors, not block them
    reportOnly: false,

    // Set to true if you want to blindly set all headers: Content-Security-Policy,
    // X-WebKit-CSP, and X-Content-Security-Policy.
    setAllHeaders: false,

    // Set to true if you want to disable CSP on Android where it can be buggy.
    disableAndroid: false,
  };

  const WEBPACK_HOST =
      `http://${config.get('webpackServerHost')}:${config.get('webpackServerPort')}`;

  if (config.get('env') === 'development') {
    CSP.directives.scriptSrc.push(WEBPACK_HOST);
    CSP.directives.styleSrc.push('blob:');
    CSP.directives.connectSrc.push(WEBPACK_HOST);
    CSP.reportOnly = true;
  }

  config.set('CSP', CSP);

  // This is the list of apps allowed to run.
  const validAppNames = ['search', 'disco'];
  config.set('validAppNames', validAppNames);

  // Create a list of apps to build targets for.
  const appName = process.env.APP_NAME;
  if (validAppNames.indexOf(appName) > -1) {
    config.set('appsBuildList', [appName]);
    config.set('currentApp', appName);
  } else {
    config.set('appsBuildList', validAppNames);
    config.set('currentApp', null);
  }
}());

export default config;
