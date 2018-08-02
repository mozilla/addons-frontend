import config from 'config';
import pino from 'pino';

const appName = config.get('appName');

export default pino({
  name: appName,
  enabled: config.get('enableLogging'),
});
