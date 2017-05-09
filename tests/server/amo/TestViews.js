import fs from 'fs';
import path from 'path';

import { assert } from 'chai';
import request from 'supertest-as-promised';

import log from 'core/logger';

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

  it('should return the application version', () => {
    const projectRoot = path.join(__dirname, '..', '..', '..');
    const versionFile = path.join(projectRoot, 'version.json');

    if (!fs.statSync(path.join(projectRoot, 'package.json'))) {
      throw new Error(`Wait, is this not the project root? ${projectRoot}`);
    }

    const versionData = {
      build: 'https://circleci.com/gh/mozilla/addons-server/6550',
      source: 'https://github.com/mozilla/addons-server',
      // This is typically blank for some reason.
      version: '',
      commit: '87f49a40ee7a5e87d9b9efde8e91b9019e8b13d1',
    };

    // Simulate how ops writes a version file in our project root.
    fs.writeFileSync(versionFile, JSON.stringify(versionData));

    function removeVersionFile() {
      fs.unlinkSync(versionFile);
    }

    return request(app)
      .get('/__frontend_version__')
      .set('Accept', 'application/json')
      .expect(200)
      .then((res) => {
        removeVersionFile();
        assert.deepEqual(res.body, versionData);
      })
      .catch((testError) => {
        try {
          removeVersionFile();
        } catch (error) {
          log.warn(`Error in removeVersionFile(): ${error}`);
        }
        throw testError;
      });
  });
});
