/* eslint-disable no-loop-func */
import { assert } from 'chai';
import Policy from 'csp-parse';
import request from 'supertest-as-promised';

import { runServer } from 'core/server/base';
import { checkSRI } from 'tests/server/helpers';

describe('Search App GET requests', () => {
  let app;

  before(() => runServer({ listen: false, app: 'search' })
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
      const policy = new Policy(res.header['content-security-policy']);
      assert.notInclude(policy.get('script-src'), "'self'");
      assert.include(policy.get('script-src'), 'https://addons-admin.cdn.mozilla.net');
      assert.notInclude(policy.get('connect-src'), "'self'");
      assert.include(policy.get('connect-src'), 'https://addons.mozilla.org');
    }));

  it('should be using SRI for script and style in /search', () => request(app)
    .get('/search')
    .expect(200)
    .then((res) => checkSRI(res)));
});
