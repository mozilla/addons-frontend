import { assert } from 'chai';
import require from 'require-uncached';

const deployedEnvs = [
  'dev',
  'production',
  'stage',
];

const cdnHosts = {
  dev: 'https://addons-dev-cdn.allizom.org',
  stage: 'https://addons-stage-cdn.allizom.org',
  production: 'https://addons.cdn.mozilla.net',
};

const apiHosts = {
  dev: 'https://addons-dev.allizom.org',
  stage: 'https://addons.allizom.org',
  production: 'https://addons.mozilla.org',
};


describe('CSP Config Defaults', () => {
  const existingNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = existingNodeEnv;
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const env of deployedEnvs) {
    // eslint-disable-next-lint no-loop-func
    it(`should have a source-list config for ${env}`, () => {
      process.env.NODE_ENV = env;
      jest.resetModules();
      const cdnHost = cdnHosts[env];
      const apiHost = apiHosts[env];
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      expect(cspConfig.scriptSrc).toContain(cdnHost);
      assert.notInclude(cspConfig.scriptSrc, "'self'");
      assert.include(cspConfig.imgSrc, cdnHost);
      assert.include(cspConfig.imgSrc, "'self'");
      assert.include(cspConfig.styleSrc, cdnHost);
      assert.notInclude(cspConfig.styleSrc, "'self'");
      assert.include(cspConfig.connectSrc, apiHost);
      assert.notInclude(cspConfig.connectSrc, "'self'");
    });
  }

  describe('CSP defaults', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      jest.resetModules();
    });

    it('should default default-src to "\'none\'"', () => {
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      expect(cspConfig.defaultSrc).toEqual(["'none'"]);
    });

    it('should default base-uri to "\'self\'"', () => {
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      assert.deepEqual(cspConfig.baseUri, ["'self'"]);
    });

    it('should default form-action to "\'none\'"', () => {
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      assert.deepEqual(cspConfig.formAction, ["'none'"]);
    });

    it('should default frame-src to "\'none\'"', () => {
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      assert.deepEqual(cspConfig.frameSrc, ["'none'"]);
    });

    it('should default child-src to "\'none\'"', () => {
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      assert.deepEqual(cspConfig.childSrc, ["'none'"]);
    });

    it('should default object-src to "\'none\'"', () => {
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      assert.deepEqual(cspConfig.objectSrc, ["'none'"]);
    });

    it('should default media-src to "\'none\'"', () => {
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      assert.deepEqual(cspConfig.mediaSrc, ["'none'"]);
    });
  });
});
