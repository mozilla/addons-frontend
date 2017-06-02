import MockExpressRequest from 'mock-express-request';
import MockExpressResponse from 'mock-express-response';

import { hsts } from 'core/middleware';

describe('HSTS Middleware', () => {
  it('provides the expected HSTS headers', () => {
    const middleware = hsts();
    const nextSpy = sinon.stub();
    const req = new MockExpressRequest();
    const res = new MockExpressResponse();
    middleware(req, res, nextSpy);
    expect(res.get('strict-transport-security')).toEqual('max-age=31536000');
    expect(nextSpy.calledOnce).toEqual(true);
  });
});
