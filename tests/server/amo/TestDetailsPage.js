/* eslint-disable no-loop-func */
import config from 'config';
import request from 'supertest-as-promised';

import { runTestServer } from '../helpers';


const fetchMock = require('fetch-mock');

const defaultURL = '/en-US/firefox/addon/fakeaddon/';
const detailsAPIURL = `${config.get('apiHost')}/api/v3/addons/addon/fakeaddon/?lang=en-US`;

describe('Details Page', () => {
  let app;

  before(() => runTestServer({ app: 'amo' })
    .then((server) => {
      app = server;
    }));

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
      },
    });
    return request(app)
      .get(defaultURL)
      .expect(404);
  });

  it('should surface an unknown API error with matching status', () => {
    fetchMock.get(detailsAPIURL, 503);
    return request(app)
      .get(defaultURL)
      .expect(503);
  });
});
