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

  it('should redirect an invalid locale', () => request(app)
    .get('/whatevs/firefox/discovery/pane/48.0/Darwin/normal?lang=dbl')
    .expect(301)
    .then((res) => {
      assert.equal(res.header.location,
        '/en-US/firefox/discovery/pane/48.0/Darwin/normal?lang=dbl');
    }));

  it('should redirect an invalid locale which will be encoded', () => request(app)
    .get('/<script>/firefox/discovery/pane/48.0/Darwin/normal?lang=dbl')
    .expect(301)
    .then((res) => {
      assert.equal(res.header.location,
        '/en-US/firefox/discovery/pane/48.0/Darwin/normal?lang=dbl');
    }));

  it('should redirect an invalid locale which will be encoded', () => request(app)
    .get('/AC%2fDC/firefox/discovery/pane/48.0/Darwin/normal?lang=dbl')
    .expect(301)
    .then((res) => {
      assert.equal(res.header.location,
        '/en-US/firefox/discovery/pane/48.0/Darwin/normal?lang=dbl');
    }));

  it('should redirect an aliased lang', () => request(app)
    .get('/pt/firefox/discovery/pane/48.0/Darwin/normal?lang=dbl')
    .expect(301)
    .then((res) => {
      assert.equal(res.header.location,
        '/pt-PT/firefox/discovery/pane/48.0/Darwin/normal?lang=dbl');
    }));

  it('should correct incorrect case', () => request(app)
    .get('/pt-br/firefox/discovery/pane/48.0/Darwin/normal?lang=dbl')
    .expect(301)
    .then((res) => {
      assert.equal(res.header.location,
        '/pt-BR/firefox/discovery/pane/48.0/Darwin/normal?lang=dbl');
    }));

  it('should not replace more than it should', () => request(app)
    .get('/48.0/firefox/discovery/pane/48.0/Darwin/normal?lang=dbl')
    .expect(301)
    .then((res) => {
      assert.equal(res.header.location,
        '/en-US/firefox/discovery/pane/48.0/Darwin/normal?lang=dbl');
    }));
});
