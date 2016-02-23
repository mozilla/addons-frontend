import path from 'path';

const config = new Map();

config.set('env', process.env.NODE_ENV || 'production');

config.set('globals', {
  __DEV__: config.get('env') === 'development',
  __PROD__: config.get('env') === 'production',
});

config.set('basePath', path.resolve(__dirname, '../'));

config.set('serverHost', process.env.NODE_HOST || '127.0.0.1');
config.set('serverPort', process.env.NODE_PORT || 4000);
config.set('webpackHost', process.env.NODE_HOST || '127.0.0.1');
config.set('webpackPort', 3000);

export default config;
