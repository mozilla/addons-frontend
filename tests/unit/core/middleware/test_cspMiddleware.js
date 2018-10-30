import MockExpressRequest from 'mock-express-request';
import MockExpressResponse from 'mock-express-response';
import parse from 'content-security-policy-parser';

import { csp } from 'core/middleware';
import { getFakeConfig, getFakeLogger } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('CSP Middleware', () => {
    const existingNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = existingNodeEnv;
      delete process.env.NODE_APP_INSTANCE;
    });

    it('provides the expected style-src directive', () => {
      process.env.NODE_ENV = 'prod';
      process.env.NODE_APP_INSTANCE = 'amo';
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
      expect(policy['style-src']).toEqual([cdnHost]);
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
