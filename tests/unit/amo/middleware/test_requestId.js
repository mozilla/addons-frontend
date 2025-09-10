/**
 * @jest-environment node
 */
import httpMocks from 'node-mocks-http';

import { AMO_REQUEST_ID_HEADER } from 'amo/constants';
import requestId from 'amo/middleware/requestId';

describe(__filename, () => {
  function _requestId({
    req = httpMocks.createRequest(),
    res = httpMocks.createResponse(),
    next = sinon.stub(),
    _httpContext = {
      set: sinon.stub(),
    },
  }) {
    return requestId(req, res, next, { _httpContext });
  }

  it('adds a generated request ID to the HTTP context and response', () => {
    const res = httpMocks.createResponse();
    const next = sinon.stub();
    const _httpContext = {
      set: sinon.stub(),
    };

    expect(res.get(AMO_REQUEST_ID_HEADER)).not.toBeDefined();
    sinon.assert.notCalled(next);
    sinon.assert.notCalled(_httpContext.set);

    _requestId({ res, next, _httpContext });

    expect(res.get('amo-request-id')).toBeDefined();
    sinon.assert.calledOnce(next);
    sinon.assert.calledOnce(_httpContext.set);
  });

  it('uses the request ID from the request when available', () => {
    const req = httpMocks.createRequest();
    const res = httpMocks.createResponse();
    const _httpContext = {
      set: sinon.stub(),
    };

    const id = 'some-request-id';
    req.headers[AMO_REQUEST_ID_HEADER] = id;

    _requestId({ req, res, _httpContext });

    expect(res.get(AMO_REQUEST_ID_HEADER)).toEqual(id);
    sinon.assert.calledWith(_httpContext.set, AMO_REQUEST_ID_HEADER, id);
  });

  it('ensures the request has AMO_REQUEST_ID_HEADER', () => {
    const req = httpMocks.createRequest();
    expect(req.get(AMO_REQUEST_ID_HEADER)).not.toBeDefined();

    _requestId({ req });

    expect(req.get(AMO_REQUEST_ID_HEADER)).toBeDefined();
  });
});
