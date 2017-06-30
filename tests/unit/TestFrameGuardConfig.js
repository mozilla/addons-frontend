/* eslint-disable global-require */
import config from 'config';

const appsList = config.get('validAppNames');

describe('App Specific Frameguard Config', () => {
  const existingNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = existingNodeEnv;
    delete process.env.NODE_APP_INSTANCE;
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const appName of appsList) {
    // eslint-disable-next-line no-loop-func
    it(`should default frameGuard to "deny" for ${appName} in production`, () => {
      process.env.NODE_ENV = 'production';
      process.env.NODE_APP_INSTANCE = appName;
      jest.resetModules();
      // eslint-disable-next-line global-require
      const conf = require('config');
      const frameGuardConfig = conf.get('frameGuard');
      expect(frameGuardConfig.action).toEqual('deny');
      expect(frameGuardConfig.domain).toEqual(undefined);
    });
  }
});
