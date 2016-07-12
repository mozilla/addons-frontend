import { assert } from 'chai';
import requireUncached from 'require-uncached';
import config from 'config';

const appsList = config.get('validAppNames');

describe('App Specific Frameguard Config', () => {
  afterEach(() => {
    process.env.NODE_ENV = 'production';
    delete process.env.NODE_APP_INSTANCE;
  });

  for (const appName of appsList) {
    it(`should default frameGuard to "deny" for ${appName} in production`, () => {
      process.env.NODE_APP_INSTANCE = appName;
      const conf = requireUncached('config');
      const frameGuardConfig = conf.get('frameGuard');
      assert.equal(frameGuardConfig.action, 'deny');
      assert.equal(frameGuardConfig.domain, undefined);
    });
  }
});
