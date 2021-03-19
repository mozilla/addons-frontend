import MockExpressRequest from 'mock-express-request';
import MockExpressResponse from 'mock-express-response';
import parse from 'content-security-policy-parser';

import { csp } from 'amo/middleware';
import { getFakeConfig, getFakeLogger } from 'tests/unit/helpers';

const deployedEnvs = ['dev', 'production', 'stage'];

const cdnHosts = {
  dev: 'https://addons-amo-dev-cdn.allizom.org',
  stage: 'https://addons-amo-cdn.allizom.org',
  production: 'https://addons-amo.cdn.mozilla.net',
};

const apiHosts = {
  dev: 'https://addons-dev.allizom.org',
  stage: 'https://addons.allizom.org',
  production: 'https://addons.mozilla.org',
};

describe(__filename, () => {
  const existingNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = existingNodeEnv;
  });

  describe('CSP Config', () => {
    for (const env of deployedEnvs) {
      // eslint-disable-next-lint no-loop-func
      it(`should have a source-list config for ${env}`, () => {
        process.env.NODE_ENV = env;
        // Reset the require cache so that the config require
        // takes into account changes to NODE_ENV.
        jest.resetModules();
        const cdnHost = cdnHosts[env];
        const apiHost = apiHosts[env];
        // eslint-disable-next-line global-require
        const config = require('config');
        const cspConfig = config.get('CSP').directives;
        expect(cspConfig.scriptSrc).toContain(`${cdnHost}/static/`);
        expect(cspConfig.scriptSrc).not.toContain("'self'");
        expect(cspConfig.imgSrc).toContain(`${cdnHost}/static/`);
        expect(cspConfig.imgSrc).toContain(`${cdnHost}/favicon.ico`);
        expect(cspConfig.imgSrc).toContain("'self'");
        expect(cspConfig.styleSrc).toContain(`${cdnHost}/static/`);
        expect(cspConfig.styleSrc).not.toContain("'self'");
        expect(cspConfig.connectSrc).toContain(apiHost);
        expect(cspConfig.connectSrc).not.toContain("'self'");
      });
    }
  });

  describe('CSP defaults', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
      // Reset the require cache so that the config require
      // takes into account changes to NODE_ENV.
      jest.resetModules();
    });

    it('should default default-src to "\'none\'"', () => {
      // eslint-disable-next-line global-require
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      expect(cspConfig.defaultSrc).toEqual(["'none'"]);
    });

    it('should default base-uri to "\'self\'"', () => {
      // eslint-disable-next-line global-require
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      expect(cspConfig.baseUri).toEqual(["'self'"]);
    });

    it('should default form-action to "\'self\'"', () => {
      // eslint-disable-next-line global-require
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      expect(cspConfig.formAction).toEqual(["'self'"]);
    });

    it('should default frame-src to "\'none\'"', () => {
      // eslint-disable-next-line global-require
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      expect(cspConfig.frameSrc).toEqual(["'none'"]);
    });

    it('should default child-src to "\'none\'"', () => {
      // eslint-disable-next-line global-require
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      expect(cspConfig.childSrc).toEqual(["'none'"]);
    });

    it('should default object-src to "\'none\'"', () => {
      // eslint-disable-next-line global-require
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      expect(cspConfig.objectSrc).toEqual(["'none'"]);
    });

    it('should default media-src to "\'none\'"', () => {
      // eslint-disable-next-line global-require
      const config = require('config');
      const cspConfig = config.get('CSP').directives;
      expect(cspConfig.mediaSrc).toEqual(["'none'"]);
    });
  });

  describe('CSP Middleware', () => {
    it('provides the expected style-src directive', () => {
      process.env.NODE_ENV = 'prod';
      jest.resetModules();
      // eslint-disable-next-line global-require
      const config = require('config');
      const middleware = csp({ _config: config });
      const nextSpy = sinon.stub();
      const req = new MockExpressRequest();
      const res = new MockExpressResponse();
      middleware(req, res, nextSpy);
      const cspHeader = res.get('content-security-policy');
      const policy = parse(cspHeader);
      const cdnHost = 'https://addons-amo.cdn.mozilla.net';
      expect(policy['style-src']).toEqual([`${cdnHost}/static/`]);
      sinon.assert.calledOnce(nextSpy);
    });

    it('converts false string to false boolean', () => {
      // This is so we can have environment config vars (`CSP=false`) for
      // `better-npm-run` that allow us to disable CSP when using dev/stage
      // data on a local dev server.
      const _log = getFakeLogger();
      const middleware = csp({ _config: getFakeConfig({ CSP: false }), _log });

      const nextSpy = sinon.stub();
      const req = new MockExpressRequest();
      const res = new MockExpressResponse();

      middleware(req, res, nextSpy);

      sinon.assert.calledWith(
        _log.warn,
        'CSP has been disabled from the config',
      );
      sinon.assert.calledOnce(nextSpy);
    });

    it('logs if the csp config is false', () => {
      const _log = getFakeLogger();
      const middleware = csp({ _config: getFakeConfig({ CSP: false }), _log });

      const nextSpy = sinon.stub();
      const req = new MockExpressRequest();
      const res = new MockExpressResponse();

      middleware(req, res, nextSpy);

      sinon.assert.calledWith(
        _log.warn,
        'CSP has been disabled from the config',
      );
      sinon.assert.calledOnce(nextSpy);
    });

    it('does not blow up if optional args missing', () => {
      csp();
    });
  });
});
