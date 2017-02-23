import { assert } from 'chai';
import request from 'supertest-as-promised';

import { checkSRI, parseCSP, runTestServer } from '../helpers';

describe('Admin views', () => {
  let app;

  before(() => runTestServer({ app: 'admin' })
    .then((server) => {
      app = server;
    }));

  after(() => {
    webpackIsomorphicTools.undo();
  });

  it('should have a CSP policy for /search', () => request(app)
    .get('/search')
    .expect(200)
    .then((res) => {
      const policy = parseCSP(res.header['content-security-policy']);
      assert.notInclude(policy.scriptSrc, "'self'");
      assert.include(policy.scriptSrc, 'https://addons-admin.cdn.mozilla.net');
      assert.notInclude(policy.connectSrc, "'self'");
      assert.include(policy.connectSrc, 'https://addons.mozilla.org');
    }));

  it('should be using SRI for script and style in /search', () => request(app)
    .get('/search')
    .expect(200)
    .then((res) => checkSRI(res)));

  it('can simulate a thrown error', () => request(app)
    .get('/simulate-error/')
    .expect(500));
});
