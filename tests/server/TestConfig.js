import { getClientConfig } from 'core/utils';
import { assert } from 'chai';
import requireUncached from 'require-uncached';


describe('Config', () => {
  afterEach(() => {
    process.env.NODE_ENV = 'production';
  });

  it('should not ever have disableSSR set to true', () => {
    const config = requireUncached('config');
    assert.equal(config.get('disableSSR'), false);
  });

  it('should provide a production config by default', () => {
    process.env.NODE_ENV = 'production';
    const config = requireUncached('config');
    const clientConfig = getClientConfig(config);
    assert.equal(config.get('apiHost'), 'https://addons.mozilla.org');
    assert.equal(clientConfig.apiHost, 'https://addons.mozilla.org');
    assert.equal(config.util.getEnv('NODE_ENV'), 'production');
  });

  it('should provide a dev config', () => {
    process.env.NODE_ENV = 'dev';
    const config = requireUncached('config');
    const clientConfig = getClientConfig(config);
    assert.equal(config.get('apiHost'), 'https://addons-dev.allizom.org');
    assert.equal(clientConfig.apiHost, 'https://addons-dev.allizom.org');
    assert.equal(config.util.getEnv('NODE_ENV'), 'dev');
  });

  it('should provide a stage config', () => {
    process.env.NODE_ENV = 'stage';
    const config = requireUncached('config');
    const clientConfig = getClientConfig(config);
    assert.equal(config.get('apiHost'), 'https://addons.allizom.org');
    assert.equal(clientConfig.apiHost, 'https://addons.allizom.org');
    assert.equal(config.util.getEnv('NODE_ENV'), 'stage');
  });

  it('should provide a development config', () => {
    process.env.NODE_ENV = 'development';
    const config = requireUncached('config');
    const clientConfig = getClientConfig(config);
    assert.equal(config.get('apiHost'), 'https://addons-dev.allizom.org');
    assert.equal(clientConfig.apiHost, 'https://addons-dev.allizom.org');
    assert.equal(config.util.getEnv('NODE_ENV'), 'development');
  });
});


describe('Config Environment Variables', () => {
  afterEach(() => {
    delete process.env.SERVER_HOST;
    delete process.env.SERVER_PORT;
  });

  it('should allow host overrides', () => {
    let config = requireUncached('config');
    assert.equal(config.get('serverHost'), '127.0.0.1', 'initial host is set');
    process.env.SERVER_HOST = '0.0.0.0';
    config = requireUncached('config');
    assert.equal(config.get('serverHost'), '0.0.0.0', 'host is overidden');
  });

  it('should allow port overrides', () => {
    let config = requireUncached('config');
    assert.equal(config.get('serverPort'), '4000', 'Initial port is set');
    process.env.SERVER_PORT = '5000';
    config = requireUncached('config');
    assert.equal(config.get('serverPort'), '5000', 'Port is overidden');
  });
});
