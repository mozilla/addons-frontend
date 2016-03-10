import path from 'path';
const config = new Map();

// Default to production unless overridden.
config.set('env', process.env.NODE_ENV || 'production');

config.set('globals', {
  __DEV__: config.get('env') === 'development',
  __PROD__: config.get('env') === 'production',
});

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

const CSP = {
  directives: {
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
  CSP.directives.connectSrc = [WEBPACK_HOST];
  CSP.reportOnly = true;
}

config.set('CSP', CSP);

const APP_NAMES = ['search', 'disco'];
if (APP_NAMES.indexOf(process.env.APP_NAME) < 0) {
  config.set('currentApp', 'core');
} else {
  config.set('currentApp', process.env.APP_NAME);
}

export default config;
