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

  for (const env of deployedEnvs) {
    // eslint-disable-next-lint no-loop-func
    it(`should have a source-list config for ${env}`, () => {
      process.env.NODE_ENV = env;
      // Reset the require cache so that the config require
      // takes into account changes to NODE_ENV.
      jest.resetModules();
      const cdnHost = cdnHosts[env];
      const apiHost = apiHosts[env];
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      expect(cspConfig.scriptSrc).toContain(cdnHost);
      expect(cspConfig.scriptSrc).not.toContain("'self'");
      expect(cspConfig.imgSrc).toContain(cdnHost);
      expect(cspConfig.imgSrc).toContain("'self'");
      expect(cspConfig.styleSrc).toContain(cdnHost);
      expect(cspConfig.styleSrc).not.toContain("'self'");
      expect(cspConfig.connectSrc).toContain(apiHost);
      expect(cspConfig.connectSrc).not.toContain("'self'");
    });
  }

  describe('CSP defaults', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      // Reset the require cache so that the config require
      // takes into account changes to NODE_ENV.
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
      expect(cspConfig.baseUri).toEqual(["'self'"]);
    });

    it('should default form-action to "\'none\'"', () => {
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      expect(cspConfig.formAction).toEqual(["'none'"]);
    });

    it('should default frame-src to "\'none\'"', () => {
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      expect(cspConfig.frameSrc).toEqual(["'none'"]);
    });

    it('should default child-src to "\'none\'"', () => {
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      expect(cspConfig.childSrc).toEqual(["'none'"]);
    });

    it('should default object-src to "\'none\'"', () => {
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      expect(cspConfig.objectSrc).toEqual(["'none'"]);
    });

    it('should default media-src to "\'none\'"', () => {
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      expect(cspConfig.mediaSrc).toEqual(["'none'"]);
    });
  });
});
