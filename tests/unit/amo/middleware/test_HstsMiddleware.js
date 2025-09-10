import httpMocks from 'node-mocks-http';

import { hsts } from 'amo/middleware';

describe(__filename, () => {
  it('provides the expected HSTS headers', () => {
    const middleware = hsts();
    const nextSpy = sinon.stub();
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();

    middleware(req, res, nextSpy);

    expect(res.get('strict-transport-security')).toEqual('max-age=31536000');
    sinon.assert.calledOnce(nextSpy);
  });
});
