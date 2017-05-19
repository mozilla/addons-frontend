/* eslint-disable no-loop-func */
import config from 'config';
import request from 'supertest-as-promised';
import { Helmet } from 'react-helmet';

import { runTestServer } from '../helpers';


const fetchMock = require('fetch-mock');

const defaultURL = '/en-US/firefox/addon/fakeaddon/';
const detailsAPIURL = `${config.get('apiHost')}/api/v3/addons/addon/fakeaddon/?lang=en-US`;
// TODO: Use a response object (like `tests/client/core/api/test_api`)
const headers = { 'Content-Type': 'application/json' };

describe('Details Page', () => {
  let app;

  before(() => {
    // Tell helmet to run as if it's a server render.
    // This is caused by the jsdom env.
    Helmet.canUseDOM = false;
    return runTestServer({ app: 'amo' })
      .then((server) => {
        app = server;
      });
  });

  after(() => {
    webpackIsomorphicTools.undo();
  });

  afterEach(() => {
    fetchMock.restore();
  });

  it('should surface a 401 error from the API', () => {
    fetchMock.get({
      matcher: detailsAPIURL,
      response: {
        status: 401,
        body: { error: 'not authorized' },
        headers,
      },
    });
    return request(app)
      .get(defaultURL)
      .expect(401);
  });

  it('should surface a 404 error from the API', () => {
    fetchMock.get({
      matcher: detailsAPIURL,
      response: {
        status: 404,
        body: { error: 'not found' },
        headers,
      },
    });
    return request(app)
      .get(defaultURL)
      .expect(404);
  });

  it('should surface an unknown API error with matching status', () => {
    fetchMock.get({
      matcher: detailsAPIURL,
      response: {
        headers,
        body: { error: 'huh' },
        status: 503,
      },
    });
    return request(app)
      .get(defaultURL)
      .expect(503);
  });
});
