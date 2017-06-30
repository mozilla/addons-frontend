import config from 'config';
import MockExpressRequest from 'mock-express-request';
import MockExpressResponse from 'mock-express-response';

import { frameguard } from 'core/middleware';

const appsList = config.get('validAppNames');


describe('Frameguard Middleware', () => {
  const existingNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = existingNodeEnv;
    delete process.env.NODE_APP_INSTANCE;
  });

  // eslint-disable-next-line no-restricted-syntax
  for (const appName of appsList) {
    // eslint-disable-next-line no-loop-func
    it(`provides the expected x-frame-options headers for ${appName}`, () => {
      process.env.NODE_ENV = 'production';
      process.env.NODE_APP_INSTANCE = appName;
      jest.resetModules();
      // eslint-disable-next-line global-require
      const conf = require('config');
      const middleware = frameguard({ _config: conf });
      const nextSpy = sinon.stub();
      const req = new MockExpressRequest();
      const res = new MockExpressResponse();
      middleware(req, res, nextSpy);
      expect(res.get('x-frame-options')).toEqual('DENY');
      expect(nextSpy.calledOnce).toEqual(true);
    });
  }

  it('does not blow up if optional args not defined', () => {
    frameguard();
  });
});
