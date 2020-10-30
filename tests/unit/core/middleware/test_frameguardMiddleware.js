import MockExpressRequest from 'mock-express-request';
import MockExpressResponse from 'mock-express-response';

import { frameguard } from 'core/middleware';

describe(__filename, () => {
  const existingNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = existingNodeEnv;
  });

  it(`provides the expected x-frame-options headers`, () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const conf = require('config');
    const middleware = frameguard({ _config: conf });
    const nextSpy = sinon.stub();
    const req = new MockExpressRequest();
    const res = new MockExpressResponse();
    middleware(req, res, nextSpy);
    expect(res.get('x-frame-options')).toEqual('DENY');
    sinon.assert.calledOnce(nextSpy);
  });

  it('does not blow up if optional args not defined', () => {
    frameguard();
  });
});
