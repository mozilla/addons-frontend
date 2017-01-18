import { assert } from 'chai';
import request from 'supertest-as-promised';

import { runServer } from 'core/server/base';

import { checkSRI, parseCSP } from '../helpers';

const defaultURL = '/en-US/firefox/';

describe('AMO GET Requests', () => {
  let app;

  before(() => runServer({ listen: false, app: 'amo' })
    .then((server) => {
      app = server;
    }));

  after(() => {
    webpackIsomorphicTools.undo();
  });

  it('should have a CSP policy on the amo app homepage', () => request(app)
    .get(defaultURL)
    .expect(200)
    .then((res) => {
      const cdnHost = 'https://addons-amo.cdn.mozilla.net';
      const policy = parseCSP(res.header['content-security-policy']);
      assert.notInclude(policy.scriptSrc, "'self'");
      assert.include(policy.scriptSrc, cdnHost);
      assert.notInclude(policy.connectSrc, "'self'");
      assert.include(policy.connectSrc, 'https://addons.mozilla.org');
      assert.equal(policy.styleSrc.length, 2);
      assert.include(policy.styleSrc, cdnHost);
      assert.include(policy.styleSrc, "'sha256-DiZjxuHvKi7pvUQCxCVyk1kAFJEUWe+jf6HWMI5agj4='");
    }));

  it('should be using SRI for script and style on the amo app homepage', () => request(app)
    .get(defaultURL)
    .expect(200)
    .then((res) => checkSRI(res)));

  it('should be a 200 for requests to the homepage directly', () => request(app)
    .get('/en-US/firefox/')
    .expect(200));

  it('should redirect an invalid locale', () => request(app)
    .get('/whatever/firefox/')
    .expect(302)
    .then((res) => {
      assert.equal(res.header.location,
        '/en-US/firefox/');
    }));
});
