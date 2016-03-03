import path from 'path';

const config = new Map();

// Default to production unless overridden.
config.set('env', process.env.NODE_ENV || 'production');

config.set('globals', {
  __DEV__: config.get('env') === 'development',
  __PROD__: config.get('env') === 'production',
});

config.set('basePath', path.resolve(__dirname, '../'));

config.set('serverHost', process.env.SERVER_HOST || '127.0.0.1');
config.set('serverPort', process.env.SERVER_PORT || 4000);

config.set('devServerHost', process.env.SERVER_HOST || '127.0.0.1');
config.set('devServerPort', process.env.SERVER_PORT || 3000);

const APP_NAMES = ['search', 'disco'];
if (APP_NAMES.indexOf(process.env.APP_NAME) < 0) {
  config.set('currentApp', 'core');
} else {
  config.set('currentApp', process.env.APP_NAME);
}

export default config;
