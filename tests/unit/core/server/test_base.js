/* eslint-disable react/no-multi-comp */
import querystring from 'querystring';

import { connectRouter, routerMiddleware } from 'connected-react-router';
import * as React from 'react';
import Helmet from 'react-helmet';
import { Route } from 'react-router-dom';
import { createStore, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import NestedStatus from 'react-nested-status';
import supertest from 'supertest';
import defaultConfig from 'config';
import cheerio from 'cheerio';
import MockExpressRequest from 'mock-express-request';

import { setRequestId } from 'core/actions';
import {
  AMO_REQUEST_ID_HEADER,
  DISCO_TAAR_CLIENT_ID_HEADER,
} from 'core/constants';
import baseServer, { SERVER_REDIRECTS, createHistory } from 'core/server/base';
import { middleware } from 'core/store';
import apiReducer from 'core/reducers/api';
import redirectToReducer, {
  sendServerRedirect,
} from 'core/reducers/redirectTo';
import usersReducer, { getCurrentUser } from 'amo/reducers/users';
import usersSaga from 'amo/sagas/users';
import * as usersApi from 'amo/api/users';
import surveyReducer, {
  initialState as initialSurveyState,
} from 'core/reducers/survey';
import telemetryReducer, { setHashedClientId } from 'disco/reducers/telemetry';
import FakeApp, { fakeAssets } from 'tests/unit/core/server/fakeApp';
import {
  createUserAccountResponse,
  getFakeConfig,
  getFakeLogger,
  userAuthToken,
} from 'tests/unit/helpers';

function createStoreAndSagas({
  history = createHistory({ req: { url: '' } }),
  reducers = {
    api: apiReducer,
    survey: surveyReducer,
    users: usersReducer,
  },
} = {}) {
  const sagaMiddleware = createSagaMiddleware();
  const store = createStore(
    combineReducers({ ...reducers, router: connectRouter(history) }),
    // Do not define an initial state.
    undefined,
    middleware({
      routerMiddleware: routerMiddleware(history),
      sagaMiddleware,
    }),
  );

  return { store, sagaMiddleware };
}

const StubApp = () => (
  <div>
    <Route path="*" component={FakeApp} />
  </div>
);

export class ServerTestHelper {
  constructor() {
    this.helmetCanUseDOM = Helmet.canUseDOM;
    this.nestedStatusCanUseDOM = NestedStatus.canUseDOM;
    this.document = global.document;
  }

  beforeEach() {
    Helmet.canUseDOM = false;
    // See: https://github.com/gaearon/react-side-effect/releases/tag/v1.0.0
    // (`react-side-effect` is a dependency of `react-nested-status`).
    NestedStatus.canUseDOM = false;
    global.webpackIsomorphicTools = {
      assets: () => fakeAssets,
    };
    // We don't want the `document` object on the server.
    delete global.document;
  }

  afterEach() {
    Helmet.canUseDOM = this.helmetCanUseDOM;
    NestedStatus.canUseDOM = this.nestedStatusCanUseDOM;
    global.document = this.document;
    delete global.webpackIsomorphicTools;
  }

  testClient({
    App = StubApp,
    appInstanceName = 'testapp',
    store = null,
    sagaMiddleware = null,
    appSagas = null,
    config = defaultConfig,
    ...baseServerParams
  } = {}) {
    function _createStoreAndSagas({ history }) {
      if (store === null) {
        return createStoreAndSagas({ history });
      }

      return { store, sagaMiddleware };
    }

    // eslint-disable-next-line no-empty-function
    function* fakeSaga() {}

    const app = baseServer(App, _createStoreAndSagas, {
      appSagas: appSagas || fakeSaga,
      appInstanceName,
      config,
      ...baseServerParams,
    });

    return supertest(app);
  }
}

describe(__filename, () => {
  let mockUsersApi;

  const serverTestHelper = new ServerTestHelper();
  const testClient = (...args) => serverTestHelper.testClient(...args);

  beforeEach(() => {
    serverTestHelper.beforeEach();
    mockUsersApi = sinon.mock(usersApi);
  });

  afterEach(() => {
    serverTestHelper.afterEach();
  });

  describe('app', () => {
    it('varies on DNT', async () => {
      const response = await testClient()
        .get('/en-US/firefox/')
        .end();

      expect(response.headers).toMatchObject({ vary: 'DNT' });
      expect(response.statusCode).toEqual(200);
    });

    it('returns the status code of NestedStatus', async () => {
      // This is an example of implementing a NotFound component
      // using NestedStatus which exercises the server's logic for
      // getting the response status code from the rendered component.
      class NotFound extends React.Component {
        render() {
          return (
            <NestedStatus code={404}>
              <h1>Not Found</h1>
            </NestedStatus>
          );
        }
      }

      const NotFoundApp = () => (
        <div>
          <Route path="*" component={NotFound} />
        </div>
      );

      const response = await testClient({ App: NotFoundApp })
        .get('/en-US/firefox/simulation-of-a-non-existent-page')
        .end();

      expect(response.statusCode).toEqual(404);
    });

    it('sets a Cache-Control header', async () => {
      const { store, sagaMiddleware } = createStoreAndSagas();

      const response = await testClient({ store, sagaMiddleware })
        .get('/en-US/firefox/')
        .end();

      expect(response.headers['cache-control']).toEqual('no-store');
    });

    it('does not dispatch setAuthToken() if cookie is not found', async () => {
      const { store, sagaMiddleware } = createStoreAndSagas();

      const response = await testClient({ store, sagaMiddleware })
        .get('/en-US/firefox/')
        .end();

      const { api } = store.getState();

      expect(response.statusCode).toEqual(200);
      expect(api.token).toBe(null);
    });

    it('dispatches setAuthToken() if cookie is present', async () => {
      const token = userAuthToken();
      const { store, sagaMiddleware } = createStoreAndSagas();
      const response = await testClient({ store, sagaMiddleware })
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="${token}"`)
        .end();

      const { api } = store.getState();

      expect(response.statusCode).toEqual(200);
      expect(api.token).toEqual(token);
    });

    it('dispatches dismissSurvey() if cookie is present', async () => {
      const { store, sagaMiddleware } = createStoreAndSagas();
      const response = await testClient({ store, sagaMiddleware })
        .get('/en-US/firefox/')
        // Set a cookie with an empty string value.
        .set(
          'cookie',
          `${defaultConfig.get('dismissedExperienceSurveyCookieName')}=""`,
        )
        .end();

      const { survey } = store.getState();

      expect(response.statusCode).toEqual(200);
      expect(survey.wasDismissed).toEqual(true);
    });

    it('does not dispatch dismissSurvey() if no cookie is present', async () => {
      const { store, sagaMiddleware } = createStoreAndSagas();
      const response = await testClient({ store, sagaMiddleware })
        .get('/en-US/firefox/')
        .end();

      const { survey } = store.getState();

      expect(response.statusCode).toEqual(200);
      expect(survey).toEqual(initialSurveyState);
    });

    it('dispatches setRequestId()', async () => {
      const { store, sagaMiddleware } = createStoreAndSagas();
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const requestId = 'example-request-id';

      await testClient({
        store,
        sagaMiddleware,
        config: getFakeConfig({ enableRequestID: true }),
      })
        .get('/en-US/firefox/')
        // The middleware will honor a request ID header rather than
        // generate a new one.
        .set(AMO_REQUEST_ID_HEADER, requestId)
        .end();

      sinon.assert.calledWith(dispatchSpy, setRequestId(requestId));
    });

    it('fetches the user profile when given a token', async () => {
      const user = createUserAccountResponse({ id: 42, username: 'babar' });

      mockUsersApi
        .expects('currentUserAccount')
        .once()
        .returns(Promise.resolve(user));

      const token = userAuthToken();
      const { store, sagaMiddleware } = createStoreAndSagas();
      const response = await testClient({
        store,
        sagaMiddleware,
        appSagas: usersSaga,
      })
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="${token}"`)
        .end();

      const { api, users } = store.getState();

      expect(response.statusCode).toEqual(200);
      expect(api.token).toEqual(token);
      expect(users.currentUserID).toEqual(42);
      expect(getCurrentUser(users).username).toEqual('babar');
      mockUsersApi.verify();
    });

    it('returns a 500 error page when retrieving the user profile fails', async () => {
      mockUsersApi
        .expects('currentUserAccount')
        .once()
        .rejects(new Error('example of an API error'));

      const token = userAuthToken();
      const { store, sagaMiddleware } = createStoreAndSagas();
      const response = await testClient({
        store,
        sagaMiddleware,
        appSagas: usersSaga,
      })
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="${token}"`)
        .end();

      expect(response.statusCode).toEqual(500);
      mockUsersApi.verify();
    });

    it('fetches the user profile even when SSR is disabled', async () => {
      const user = createUserAccountResponse({ id: 42, username: 'babar' });

      mockUsersApi
        .expects('currentUserAccount')
        .once()
        .returns(Promise.resolve(user));

      const token = userAuthToken();
      const { store, sagaMiddleware } = createStoreAndSagas();
      const config = getFakeConfig({ disableSSR: true });

      const client = testClient({
        store,
        sagaMiddleware,
        appSagas: usersSaga,
        config,
      });

      const response = await client
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="${token}"`)
        .end();

      const { api, users } = store.getState();

      expect(response.statusCode).toEqual(200);
      expect(api.token).toEqual(token);
      expect(users.currentUserID).toEqual(42);
      expect(getCurrentUser(users).username).toEqual('babar');
      mockUsersApi.verify();

      // Parse the HTML response to retrieve the serialized redux state.
      // We do this here to make sure the sagas are actually run, because the
      // API token is retrieved from the cookie on the server, therefore the
      // user profile too.
      const $ = cheerio.load(response.res.text);
      const reduxStoreState = JSON.parse($('#redux-store-state').html());

      expect(reduxStoreState.api).toEqual(api);
      expect(getCurrentUser(reduxStoreState.users)).toMatchObject(user);
    });

    it('it serializes the redux state in html', async () => {
      const user = createUserAccountResponse({ id: 42, username: 'babar' });

      mockUsersApi
        .expects('currentUserAccount')
        .once()
        .returns(Promise.resolve(user));

      const token = userAuthToken();
      const { store, sagaMiddleware } = createStoreAndSagas();

      const client = testClient({
        store,
        sagaMiddleware,
        appSagas: usersSaga,
      });

      const response = await client
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="${token}"`)
        .end();

      const { api, users } = store.getState();

      // Parse the HTML response to retrieve the serialized redux state.
      const $ = cheerio.load(response.res.text);
      const reduxStoreState = JSON.parse($('#redux-store-state').html());

      expect(reduxStoreState.api).toEqual(api);
      expect(reduxStoreState.users).toMatchObject(users);
      mockUsersApi.verify();
    });

    it('performs a server redirect when requested by the app', async () => {
      const { store, sagaMiddleware } = createStoreAndSagas({
        reducers: {
          redirectTo: redirectToReducer,
        },
      });
      const newURL = '/redirect/to/this/url';

      class Redirect extends React.Component {
        constructor(props) {
          super(props);

          store.dispatch(
            sendServerRedirect({
              status: 301,
              url: newURL,
            }),
          );
        }

        render() {
          return <p>a component that requests a server redirect</p>;
        }
      }

      const RedirectApp = () => (
        <div>
          <Route path="*" component={Redirect} />
        </div>
      );

      const client = testClient({
        App: RedirectApp,
        sagaMiddleware,
        store,
      });

      const response = await client.get(`/en-US/firefox/`).end();

      expect(response.status).toEqual(301);
      expect(response.headers.location).toEqual(newURL);
    });

    it('catches all errors and returns a 500', async () => {
      const _log = getFakeLogger();
      const _createHistory = () => {
        throw new Error('oops');
      };

      const response = await testClient({ _createHistory, _log })
        .get('/en-US/firefox/')
        .end();

      expect(response.statusCode).toEqual(500);

      // Error caught in the main handler.
      sinon.assert.calledWith(
        _log.error,
        sinon.match(/Caught an unexpected error while handling the request/),
      );
      // Error logged in the error handler.
      sinon.assert.calledWith(
        _log.error,
        sinon.match(/Showing 500 page for error: Error: oops/),
      );
      // Error caught while trying to render a 500 page.
      sinon.assert.calledWith(
        _log.error,
        sinon.match(/Additionally, the error handler caught an error:/),
      );
    });
  });

  describe('TAARDIS', () => {
    it('varies the moz-client-id header in disco', async () => {
      const response = await testClient({
        appInstanceName: 'disco',
      })
        .get('/en-US/firefox/')
        .end();

      expect(response.headers).toMatchObject({
        vary: `DNT, ${DISCO_TAAR_CLIENT_ID_HEADER}`,
      });
      expect(response.statusCode).toEqual(200);
    });

    it('does not send the moz-client-id header for other apps', async () => {
      const response = await testClient({
        appInstanceName: 'amo',
      })
        .get('/en-US/firefox/')
        .end();

      expect(response.headers).toMatchObject({
        vary: 'DNT',
      });
      expect(response.statusCode).toEqual(200);
    });

    it('dispatches setHashedClientId() if clientId header is present and enableFeatureDiscoTaar is true and app is disco', async () => {
      const clientId = '1112';
      const fakeConfig = getFakeConfig({
        enableFeatureDiscoTaar: true,
      });

      const { store, sagaMiddleware } = createStoreAndSagas({
        reducers: {
          telemetry: telemetryReducer,
        },
      });

      const dispatchSpy = sinon.spy(store, 'dispatch');

      const response = await testClient({
        appInstanceName: 'disco',
        config: fakeConfig,
        store,
        sagaMiddleware,
      })
        .get('/en-US/firefox/')
        .set(DISCO_TAAR_CLIENT_ID_HEADER, clientId)
        .end();

      sinon.assert.calledWith(dispatchSpy, setHashedClientId(clientId));

      expect(response.statusCode).toEqual(200);
      expect(store.getState().telemetry.hashedClientId).toEqual(clientId);
    });

    it('does not dispatch setHashedClientId() if enableFeatureDiscoTaar is false', async () => {
      const clientId = '1112';
      const fakeConfig = getFakeConfig({
        enableFeatureDiscoTaar: false,
      });

      const { store, sagaMiddleware } = createStoreAndSagas();

      const dispatchSpy = sinon.spy(store, 'dispatch');

      const response = await testClient({
        appInstanceName: 'disco',
        config: fakeConfig,
        store,
        sagaMiddleware,
      })
        .get('/en-US/firefox/')
        .set(DISCO_TAAR_CLIENT_ID_HEADER, clientId)
        .end();

      sinon.assert.neverCalledWith(dispatchSpy, setHashedClientId(clientId));

      expect(response.statusCode).toEqual(200);
      expect(store.getState().telemetry).toEqual(undefined);
    });

    it('does not dispatch setHashedClientId() if there is no moz-client-id header', async () => {
      const fakeConfig = getFakeConfig({
        enableFeatureDiscoTaar: true,
      });
      const { store, sagaMiddleware } = createStoreAndSagas();

      const dispatchSpy = sinon.spy(store, 'dispatch');

      const response = await testClient({
        appInstanceName: 'disco',
        config: fakeConfig,
        store,
        sagaMiddleware,
      })
        .get('/en-US/firefox/')
        .end();

      sinon.assert.neverCalledWith(dispatchSpy, setHashedClientId('1112'));

      expect(response.statusCode).toEqual(200);
      expect(store.getState().telemetry).toEqual(undefined);
    });

    it('does not dispatch setHashedClientId() if moz-client-id is null', async () => {
      const fakeConfig = getFakeConfig({
        enableFeatureDiscoTaar: true,
      });
      const { store, sagaMiddleware } = createStoreAndSagas();

      const dispatchSpy = sinon.spy(store, 'dispatch');

      const response = await testClient({
        appInstanceName: 'disco',
        config: fakeConfig,
        store,
        sagaMiddleware,
      })
        .get('/en-US/firefox/')
        .set(DISCO_TAAR_CLIENT_ID_HEADER, null)
        .end();

      sinon.assert.neverCalledWith(dispatchSpy, setHashedClientId('1112'));

      expect(response.statusCode).toEqual(200);
      expect(store.getState().telemetry).toEqual(undefined);
    });

    it('does not dispatch setHashedClientId() if app is not disco', async () => {
      const clientId = '1112';
      const fakeConfig = getFakeConfig({
        enableFeatureDiscoTaar: true,
      });
      const { store, sagaMiddleware } = createStoreAndSagas();

      const dispatchSpy = sinon.spy(store, 'dispatch');

      const response = await testClient({
        appInstanceName: 'not-disco',
        config: fakeConfig,
        store,
        sagaMiddleware,
      })
        .get('/en-US/firefox/')
        .set(DISCO_TAAR_CLIENT_ID_HEADER, clientId)
        .end();

      sinon.assert.neverCalledWith(dispatchSpy, setHashedClientId(clientId));

      expect(response.statusCode).toEqual(200);

      expect(store.getState().telemetry).toEqual(undefined);
    });
  });

  describe('createHistory', () => {
    it('creates a history object with query parameters', () => {
      const request = {
        url: '/',
      };
      const history = createHistory({ req: request });

      expect(history).toHaveProperty('location.query');
    });
  });

  describe('SERVER_REDIRECTS', () => {
    it.each([
      // Each entry should have the following shape:
      //
      // [
      //   <an old URL>,
      //   <the redirect config for this URL>,
      //   <optional string to expect in the new URL>
      // ]
      //
      ['/android', SERVER_REDIRECTS.androidWithoutTrailingSlash],
      [
        '/android?foo=bar',
        SERVER_REDIRECTS.androidWithoutTrailingSlash,
        '/?foo',
      ],
    ])(
      'redirects "%s"',
      async (url, { buildNewURL, status }, expectedInURL = '') => {
        // We have to split the URL because of how superagent/supertest works.
        const [urlWithoutQueryString, queryString] = url.split('?');

        const response = await testClient()
          .get(urlWithoutQueryString)
          .query(queryString)
          .end();

        const newURL = buildNewURL({
          // We cannot retrieve the original Express request with
          // superagent/supertest, so we have to create a mock here.
          req: new MockExpressRequest({
            url,
            query: querystring.parse(queryString),
          }),
        });

        expect(response.headers).toMatchObject({ location: newURL });
        expect(response.statusCode).toEqual(status);
        expect(newURL).toContain(expectedInURL);
      },
    );
  });
});
