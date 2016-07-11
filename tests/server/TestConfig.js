import { getClientConfig } from 'core/utils';
import { assert } from 'chai';
import requireUncached from 'require-uncached';
import config from 'config';

const appsList = config.get('validAppNames');


describe('Config', () => {
  afterEach(() => {
    process.env.NODE_ENV = 'production';
    delete process.env.NODE_APP_INSTANCE;
  });

  for (const appName of appsList) {
    it(`should not ever have disableSSR set to true for ${appName}`, () => {
      const conf = requireUncached('config');
      assert.equal(conf.get('disableSSR'), false);
    });

    it(`should provide a production conf by default for ${appName}`, () => {
      process.env.NODE_ENV = 'production';
      const conf = requireUncached('config');
      const clientConfig = getClientConfig(conf);
      assert.equal(conf.get('apiHost'), 'https://addons.mozilla.org');
      assert.equal(clientConfig.apiHost, 'https://addons.mozilla.org');
      assert.equal(conf.util.getEnv('NODE_ENV'), 'production');
    });

    it(`should provide a dev conf for ${appName}`, () => {
      process.env.NODE_ENV = 'dev';
      const conf = requireUncached('config');
      const clientConfig = getClientConfig(conf);
      assert.equal(conf.get('apiHost'), 'https://addons-dev.allizom.org');
      assert.equal(clientConfig.apiHost, 'https://addons-dev.allizom.org');
      assert.equal(conf.util.getEnv('NODE_ENV'), 'dev');
    });

    it(`should provide a stage conf for ${appName}`, () => {
      process.env.NODE_ENV = 'stage';
      const conf = requireUncached('config');
      const clientConfig = getClientConfig(conf);
      assert.equal(conf.get('apiHost'), 'https://addons.allizom.org');
      assert.equal(clientConfig.apiHost, 'https://addons.allizom.org');
      assert.equal(conf.util.getEnv('NODE_ENV'), 'stage');
    });

    it(`should provide a development conf for ${appName}`, () => {
      process.env.NODE_ENV = 'development';
      const conf = requireUncached('config');
      const clientConfig = getClientConfig(conf);
      assert.equal(conf.get('apiHost'), 'https://addons-dev.allizom.org');
      assert.equal(clientConfig.apiHost, 'https://addons-dev.allizom.org');
      assert.equal(conf.util.getEnv('NODE_ENV'), 'development');
    });
  }
});


describe('Config Environment Variables', () => {
  afterEach(() => {
    delete process.env.SERVER_HOST;
    delete process.env.SERVER_PORT;
  });

  it('should allow host overrides', () => {
    let conf = requireUncached('config');
    assert.equal(conf.get('serverHost'), '127.0.0.1', 'initial host is set');
    process.env.SERVER_HOST = '0.0.0.0';
    conf = requireUncached('config');
    assert.equal(conf.get('serverHost'), '0.0.0.0', 'host is overidden');
  });

  it('should allow port overrides', () => {
    let conf = requireUncached('config');
    assert.equal(conf.get('serverPort'), '4000', 'Initial port is set');
    process.env.SERVER_PORT = '5000';
    conf = requireUncached('config');
    assert.equal(conf.get('serverPort'), '5000', 'Port is overidden');
  });
});
