import config from 'config';
import pino from 'pino';

const appName = config.get('appName');

export default pino({
  level: config.get('loggingLevel'),
  name: appName,
});
