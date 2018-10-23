import MockExpressRequest from 'mock-express-request';
import MockExpressResponse from 'mock-express-response';

import { AMO_REQUEST_ID_HEADER } from 'core/constants';
import requestId from 'core/middleware/requestId';

describe(__filename, () => {
  it('adds a generated request ID to the HTTP context and response', () => {
    const req = new MockExpressRequest();
    const res = new MockExpressResponse();
    const next = sinon.stub();
    const _httpContext = {
      set: sinon.stub(),
    };

    expect(res.get(AMO_REQUEST_ID_HEADER)).not.toBeDefined();
    sinon.assert.notCalled(next);
    sinon.assert.notCalled(_httpContext.set);

    requestId(req, res, next, { _httpContext });

    expect(res.get('amo-request-id')).toBeDefined();
    sinon.assert.calledOnce(next);
    sinon.assert.calledOnce(_httpContext.set);
  });

  it('uses the request ID from the request when available', () => {
    const req = new MockExpressRequest();
    const res = new MockExpressResponse();
    const next = sinon.stub();
    const _httpContext = {
      set: sinon.stub(),
    };

    const id = 'some-request-id';
    req.headers[AMO_REQUEST_ID_HEADER] = id;

    requestId(req, res, next, { _httpContext });

    expect(res.get(AMO_REQUEST_ID_HEADER)).toEqual(id);
    sinon.assert.calledWith(_httpContext.set, AMO_REQUEST_ID_HEADER, id);
  });
});
