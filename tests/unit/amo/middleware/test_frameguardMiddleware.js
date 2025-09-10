import httpMocks from 'node-mocks-http';

import { frameguard } from 'amo/middleware';

describe(__filename, () => {
  const existingNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = existingNodeEnv;
  });

  it('provides the expected x-frame-options headers', () => {
    process.env.NODE_ENV = 'production';
    jest.resetModules();
    // eslint-disable-next-line global-require
    const conf = require('config');
    const middleware = frameguard({ _config: conf });
    const nextSpy = sinon.stub();
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    middleware(req, res, nextSpy);
    expect(res.get('x-frame-options')).toEqual('DENY');
    sinon.assert.calledOnce(nextSpy);
  });

  // eslint-disable-next-line jest/expect-expect
  it('does not blow up if optional args not defined', () => {
    frameguard();
  });
});
