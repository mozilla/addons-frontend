import httpMocks from 'node-mocks-http';
import parse from 'content-security-policy-parser';

import { csp } from 'amo/middleware';
import { getFakeConfig, getFakeLogger } from 'tests/unit/helpers';

const envs = ['dev', 'stage', 'production'];

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
    it.each(envs)(
      'should have a CSP config for %s (statics on same domain)',
      (env) => {
        process.env.NODE_ENV = env;
        // Reset the require cache so that the config require
        // takes into account changes to NODE_ENV.
        jest.resetModules();
        const apiHost = apiHosts[env];
        const mainHost = apiHost;
        // eslint-disable-next-line global-require
        const config = require('config');
        const cspConfig = config.get('CSP').directives;
        // We use a sub-folder on purpose, see:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1501687
        expect(cspConfig.scriptSrc).not.toContain(mainHost);
        expect(cspConfig.scriptSrc).toContain(`${mainHost}/static-frontend/`);
        expect(cspConfig.scriptSrc).not.toContain("'self'");
        // We use a sub-folder on purpose, see:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1501687
        expect(cspConfig.imgSrc).not.toContain(mainHost);
        expect(cspConfig.imgSrc).toContain(`${mainHost}/static-frontend/`);
        expect(cspConfig.imgSrc).toContain(`${mainHost}/static-server/`);
        expect(cspConfig.imgSrc).toContain(`${mainHost}/user-media/`);
        expect(cspConfig.imgSrc).toContain("'self'");
        // We use a sub-folder on purpose, see:
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1501687
        expect(cspConfig.styleSrc).not.toContain(mainHost);
        expect(cspConfig.styleSrc).toContain(`${mainHost}/static-frontend/`);
        expect(cspConfig.styleSrc).not.toContain("'self'");
        expect(cspConfig.connectSrc).toContain(apiHost);
        expect(cspConfig.connectSrc).not.toContain("'self'");
      },
    );
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
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();
      middleware(req, res, nextSpy);
      const cspHeader = res.get('content-security-policy');
      const policy = parse(cspHeader);
      const host = 'https://addons.mozilla.org';
      expect(policy.get('style-src')).toEqual([`${host}/static-frontend/`]);
      sinon.assert.calledOnce(nextSpy);
    });

    it('converts false string to false boolean', () => {
      // This is so we can have environment config vars (`CSP=false`) for
      // `better-npm-run` that allow us to disable CSP when using dev/stage
      // data on a local dev server.
      const _log = getFakeLogger();
      const middleware = csp({ _config: getFakeConfig({ CSP: false }), _log });

      const nextSpy = sinon.stub();
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();

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
      const req = httpMocks.createRequest();
      const res = httpMocks.createResponse();

      middleware(req, res, nextSpy);

      sinon.assert.calledWith(
        _log.warn,
        'CSP has been disabled from the config',
      );
      sinon.assert.calledOnce(nextSpy);
    });

    // eslint-disable-next-line jest/expect-expect
    it('does not blow up if optional args missing', () => {
      csp();
    });
  });
});
