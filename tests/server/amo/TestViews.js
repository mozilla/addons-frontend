import { assert } from 'chai';
import request from 'supertest-as-promised';

import { checkSRI, parseCSP, runTestServer } from '../helpers';

const defaultURL = '/en-US/firefox/';

describe('AMO GET Requests', () => {
  let app;

  before(() => runTestServer({ app: 'amo' })
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

  it('should NOT redirect a URL without a trailing slash if exception exists',
  () => request(app)
    .get('/en-US/about')
    .expect(404)
    );

  it('should redirect a URL without a trailing slash', () => request(app)
    .get('/en-US/firefox/search')
    .expect(301)
    .then((res) => {
      assert.equal(res.header.location,
        '/en-US/firefox/search/');
    }));

  it('should respond with a 404 to user pages', () => request(app)
    .get('/en-US/firefox/user/some-user/')
    .expect(404));

  it('should respond with a 404 to the user ajax page', () => request(app)
    .get('/en-US/firefox/users/ajax')
    .expect(404));

  it('should respond with a 404 to the user delete page', () => request(app)
    .get('/en-US/firefox/users/delete')
    .expect(404));

  it('should respond with a 404 to the user edit page', () => request(app)
    .get('/en-US/firefox/users/edit')
    .expect(404));

  it('should respond with a 404 to the user login page', () => request(app)
    .get('/en-US/firefox/users/login')
    .expect(404));

  it('should respond with a 404 to the user logout page', () => request(app)
    .get('/en-US/firefox/users/logout')
    .expect(404));

  it('should respond with a 404 to the user register page', () => request(app)
    .get('/en-US/firefox/users/register')
    .expect(404));

  // These will cause addons-server to redirect back to the URL without a
  // trailing slash, but that will work as we 404 on that too.
  it('should 404 the user edit page with slashes', () => request(app)
    .get('/en-US/firefox/users/edit/')
    .expect(404));

  it('should 404 the user login page with slashes', () => request(app)
    .get('/en-US/firefox/users/login/')
    .expect(404));

  it('should respond with a 404 to a specific user edit', () => request(app)
    .get('/en-US/firefox/users/edit/1234/')
    .expect(404));

  it('should respond with a 404 to user unsubscribe actions', () => request(app)
    .get('/en-US/firefox/users/unsubscribe/token/signature/permission/')
    .expect(404));

  it('should respond with a 404 to deleting a user photo', () => request(app)
    .get('/en-US/firefox/users/delete_photo/1234/')
    .expect(404));

  it('should respond with a 404 to any user action', () => request(app)
    .get('/en-US/firefox/users/login/')
    .expect(404));
});
