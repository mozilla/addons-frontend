import config from 'config';
import bunyan from 'bunyan';

/*
 * NOTE: the client version of this is loaded from
 * core/client/logger when running client code.
 * This magical substitution is orchestrated by webpack.
 */

export default bunyan.createLogger({
  name: 'server',
  app: config.get('appName'),
  serializers: bunyan.stdSerializers,
});
