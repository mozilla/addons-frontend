/* eslint-disable no-loop-func */

import request from 'supertest-as-promised';
import { assert } from 'chai';

import { runServer } from 'core/server/base';
import Policy from 'csp-parse';


describe('GET requests', () => {
  let app;

  before((done) => runServer({listen: false})
    .then((server) => {
      app = server;
      done();
    }));

  after(() => {
    webpackIsomorphicTools.undo();
  });

  for (const path of ['search', 'disco']) {
    it(`should have a CSP policy for ${path}`, () => request(app)
      .get(`/${path}`)
      .expect(200)
      .then((res) => {
        const policy = new Policy(res.header['content-security-policy']);
        assert.include(policy.get('script-src'), "'self'");
        assert.include(policy.get('connect-src'), "'self'");
      }));
  }
});
