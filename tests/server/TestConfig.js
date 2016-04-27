import { getClientConfig } from 'core/utils';
import { assert } from 'chai';
import requireUncached from 'require-uncached';


describe('Config', () => {
  afterEach(() => {
    process.env.NODE_ENV = 'production';
  });

  it('should provide a production config by default', () => {
    process.env.NODE_ENV = 'production';
    const config = requireUncached('config');
    const clientConfig = getClientConfig(config);
    assert.equal(config.get('apiHost'), 'https://addons.mozilla.org');
    assert.include(clientConfig.startLoginUrl, 'https://addons.mozilla.org');
    assert.equal(config.util.getEnv('NODE_ENV'), 'production');
  });

  it('should provide a dev config', () => {
    process.env.NODE_ENV = 'dev';
    const config = requireUncached('config');
    const clientConfig = getClientConfig(config);
    assert.equal(config.get('apiHost'), 'https://addons-dev.allizom.org');
    assert.include(clientConfig.startLoginUrl, 'https://addons-dev.allizom.org');
    assert.equal(config.util.getEnv('NODE_ENV'), 'dev');
  });

  it('should provide a stage config', () => {
    process.env.NODE_ENV = 'stage';
    const config = requireUncached('config');
    const clientConfig = getClientConfig(config);
    assert.equal(config.get('apiHost'), 'https://addons.allizom.org');
    assert.include(clientConfig.startLoginUrl, 'https://addons.allizom.org');
    assert.equal(config.util.getEnv('NODE_ENV'), 'stage');
  });

  it('should provide a development config', () => {
    process.env.NODE_ENV = 'development';
    const config = requireUncached('config');
    const clientConfig = getClientConfig(config);
    assert.equal(config.get('apiHost'), 'https://addons-dev.allizom.org');
    assert.include(clientConfig.startLoginUrl, 'https://addons-dev.allizom.org');
    assert.equal(config.util.getEnv('NODE_ENV'), 'development');
  });
});
