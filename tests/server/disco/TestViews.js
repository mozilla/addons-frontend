import { assert } from 'chai';
import request from 'supertest-as-promised';

import { checkSRI, parseCSP, runTestServer } from '../helpers';

const defaultURL = '/en-US/firefox/discovery/pane/48.0/Darwin/normal';

describe('Discovery Pane GET requests', () => {
  let app;

  before(() => runTestServer({ app: 'disco' })
    .then((server) => {
      app = server;
    }));

  after(() => {
    webpackIsomorphicTools.undo();
  });

  it('should have a CSP policy on the disco app', () => request(app)
    .get(defaultURL)
    .expect(200)
    .then((res) => {
      const cdnHost = 'https://addons-discovery.cdn.mozilla.net';
      const policy = parseCSP(res.header['content-security-policy']);
      assert.notInclude(policy.scriptSrc, "'self'");
      assert.include(policy.scriptSrc, cdnHost);
      assert.notInclude(policy.connectSrc, "'self'");
      assert.include(policy.connectSrc, 'https://addons.mozilla.org');
      assert.equal(policy.styleSrc.length, 2);
      assert.include(policy.styleSrc, cdnHost);
      assert.include(policy.styleSrc, "'sha256-DiZjxuHvKi7pvUQCxCVyk1kAFJEUWe+jf6HWMI5agj4='");
    }));

  it('should be using SRI for script and style', () => request(app)
    .get(defaultURL)
    .expect(200)
    .then((res) => checkSRI(res)));

  it('should be a 404 for requests to /en-US/firefox', () => request(app)
    .get('/en-US/firefox')
    .expect(404));

  it('should be a 404 for requests to /en-US/firefox/', () => request(app)
    .get('/en-US/firefox/')
    .expect(404));

  it('should redirect an invalid locale', () => request(app)
    .get('/whatevs/firefox/discovery/pane/48.0/Darwin/normal')
    .expect(302)
    .then((res) => {
      assert.equal(res.header.location,
        '/en-US/firefox/discovery/pane/48.0/Darwin/normal');
    }));

  it('should set an HSTS header', () => request(app)
    .get('/en-US/firefox/discovery/pane/48.0/Darwin/normal')
    .then((res) => {
      assert.equal(res.header['strict-transport-security'], 'max-age=31536000');
    }));

  it('can simulate a thrown error', () => request(app)
    .get('/en-US/firefox/simulate-error/')
    .expect(500));
});
