import { assert } from 'chai';
import requireUncached from 'require-uncached';

describe('App Specific Frameguard Config', () => {
  afterEach(() => {
    process.env.NODE_ENV = 'production';
    delete process.env.NODE_APP_INSTANCE;
  });

  it('should default frameGuard to "deny"', () => {
    const config = requireUncached('config');
    const frameGuardConfig = config.get('frameGuard');
    assert.equal(frameGuardConfig.action, 'deny');
    assert.equal(frameGuardConfig.domain, undefined);
  });
});
