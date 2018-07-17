import MockExpressRequest from 'mock-express-request';
import MockExpressResponse from 'mock-express-response';

import log from 'core/logger';
import { logRequests } from 'core/middleware';

describe(__filename, () => {
  it('logs requests', () => {
    const middleware = logRequests;
    const req = new MockExpressRequest();
    const res = new MockExpressResponse();
    const nextSpy = sinon.stub();
    const logInfoStub = sinon.stub(log, 'info');

    middleware(req, res, nextSpy);

    sinon.assert.called(logInfoStub);
    sinon.assert.calledOnce(nextSpy);
  });
});
