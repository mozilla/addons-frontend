/* eslint-disable no-loop-func */

import request from 'supertest-as-promised';
import { assert } from 'chai';

import { runServer } from 'core/server/base';
import Policy from 'csp-parse';

import { checkSRI } from './helpers';


describe('GET requests', () => {
  let app;

  before(() => runServer({listen: false, app: 'disco'})
    .then((server) => {
      app = server;
    }));

  after(() => {
    webpackIsomorphicTools.undo();
  });

  it('should have a CSP policy for / on the disco app', () => request(app)
    .get('/')
    .expect(200)
    .then((res) => {
      const policy = new Policy(res.header['content-security-policy']);
      assert.notInclude(policy.get('script-src'), "'self'");
      assert.include(policy.get('script-src'), 'https://addons.cdn.mozilla.net');
      assert.notInclude(policy.get('connect-src'), "'self'");
      assert.include(policy.get('connect-src'), 'https://addons.mozilla.org');
    }));

  it('should be using SRI for script and style in /', () => request(app)
    .get('/')
    .expect(200)
    .then((res) => checkSRI(res)));
});
