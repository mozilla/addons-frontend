/**
 * @jest-environment node
 */
/* eslint-disable react/no-multi-comp, max-classes-per-file */
import { all, fork } from 'redux-saga/effects';
import * as React from 'react';
import { Helmet } from 'react-helmet';
import { Route } from 'react-router-dom';
import { createReduxHistoryContext } from 'redux-first-history';
import createSagaMiddleware from 'redux-saga';
import NestedStatus from 'react-nested-status';
import supertest from 'supertest';
import defaultConfig from 'config';
import cheerio from 'cheerio';
import { configureStore } from '@reduxjs/toolkit';

import { REGION_CODE_HEADER, createApiError } from 'amo/api';
import { AMO_REQUEST_ID_HEADER } from 'amo/constants';
import baseServer, { createHistory } from 'amo/server/base';
import { createRootReducer, middleware } from 'amo/store';
import apiReducer, { setRegionCode, setRequestId } from 'amo/reducers/api';
import redirectToReducer, { sendServerRedirect } from 'amo/reducers/redirectTo';
import usersReducer, { getCurrentUser } from 'amo/reducers/users';
import usersSaga from 'amo/sagas/users';
import * as usersApi from 'amo/api/users';
import * as siteApi from 'amo/api/site';
import siteReducer from 'amo/reducers/site';
import siteSaga from 'amo/sagas/site';
import FakeApp, { fakeAssets } from 'tests/unit/amo/server/fakeApp';
import {
  createUserAccountResponse,
  getFakeConfig,
  getFakeLogger,
  userAuthSessionId,
} from 'tests/unit/helpers_node';

function createStoreAndSagas({
  history = createHistory({ req: { url: '' } }),
  reducers = {
    api: apiReducer,
    site: siteReducer,
    users: usersReducer,
  },
} = {}) {
  const sagaMiddleware = createSagaMiddleware();
  const { createReduxHistory, routerMiddleware } = createReduxHistoryContext({
    history,
  });

  const store = configureStore({
    reducer: createRootReducer({ reducers }),
    // Do not define an initial state.
    preloadedState: undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        middleware({
          routerMiddleware,
          sagaMiddleware,
        }),
      ),
  });

  return { connectedHistory: createReduxHistory(store), sagaMiddleware, store };
}

const StubApp = () => (
  <div>
    <Route path="*" component={FakeApp} />
  </div>
);

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

const X_ACCEL_EXPIRES_HEADER = 'x-accel-expires'; // Has to be in lowercase

// eslint-disable-next-line jest/no-export
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
    connectedHistory = null,
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

      return { connectedHistory, store, sagaMiddleware };
    }

    // eslint-disable-next-line no-empty-function
    function* fakeSaga() {}

    const app = baseServer(App, _createStoreAndSagas, {
      appSagas: appSagas || fakeSaga,
      config,
      ...baseServerParams,
    });

    return supertest(app);
  }
}

describe(__filename, () => {
  let mockSiteApi;
  let mockUsersApi;

  const serverTestHelper = new ServerTestHelper();
  const testClient = (...args) => serverTestHelper.testClient(...args);

  beforeEach(() => {
    serverTestHelper.beforeEach();
    mockSiteApi = sinon.mock(siteApi);
    mockUsersApi = sinon.mock(usersApi);
  });

  afterEach(() => {
    serverTestHelper.afterEach();
  });

  describe('app', () => {
    it('enables gzip compression if client sends accept-encoding', async () => {
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();

      const response = await testClient({
        connectedHistory,
        sagaMiddleware,
        store,
      })
        .get('/en-US/firefox/')
        .set('Accept-Encoding', 'gzip');
      expect(response.headers['content-encoding']).toEqual('gzip');
    });

    it('varies on DNT, User-Agent and Accept-Encoding', async () => {
      const response = await testClient().get('/en-US/firefox/');

      expect(response.headers).toMatchObject({
        vary: 'DNT, User-Agent, Accept-Encoding',
      });
      expect(response.statusCode).toEqual(200);
    });

    it('returns the status code of NestedStatus', async () => {
      const response = await testClient({ App: NotFoundApp }).get(
        '/en-US/firefox/simulation-of-a-non-existent-page/',
      );
      expect(response.statusCode).toEqual(404);
    });

    it('sets a Cache-Control header', async () => {
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();

      const response = await testClient({
        connectedHistory,
        sagaMiddleware,
        store,
      }).get('/en-US/firefox/');
      expect(response.headers['cache-control']).toEqual(
        'max-age=0, s-maxage=360',
      );
    });

    it('does not dispatch setAuthToken() if cookie is not found', async () => {
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();

      const response = await testClient({
        connectedHistory,
        store,
        sagaMiddleware,
      }).get('/en-US/firefox/');
      const { api } = store.getState();

      expect(response.statusCode).toEqual(200);
      expect(api.token).toEqual(null);
    });

    it('dispatches setAuthToken() if cookie is present', async () => {
      const token = userAuthSessionId();
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();
      const response = await testClient({
        connectedHistory,
        sagaMiddleware,
        store,
      })
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="${token}"`);
      const { api } = store.getState();

      expect(response.statusCode).toEqual(200);
      expect(api.token).toEqual(token);
    });

    it('dispatches setRequestId()', async () => {
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const requestId = 'example-request-id';

      await testClient({
        connectedHistory,
        store,
        sagaMiddleware,
        config: getFakeConfig({ enableRequestID: true }),
      })
        .get('/en-US/firefox/')
        // The middleware will honor a request ID header rather than
        // generate a new one.
        .set(AMO_REQUEST_ID_HEADER, requestId);
      sinon.assert.calledWith(dispatchSpy, setRequestId(requestId));
    });

    it('dispatches setRegionCode() when the region code header is set on the request', async () => {
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();
      const dispatchSpy = sinon.spy(store, 'dispatch');
      const regionCode = 'CA';

      await testClient({
        connectedHistory,
        store,
        sagaMiddleware,
      })
        .get('/en-US/firefox/')
        .set(REGION_CODE_HEADER, regionCode);
      sinon.assert.calledWith(dispatchSpy, setRegionCode(regionCode));
    });

    it('does not dispatch setRegionCode() when the region code header is not set on the request', async () => {
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();
      const dispatchSpy = sinon.spy(store, 'dispatch');

      await testClient({
        connectedHistory,
        store,
        sagaMiddleware,
      }).get('/en-US/firefox/');
      sinon.assert.neverCalledWith(
        dispatchSpy,
        setRegionCode(sinon.match.string),
      );
    });

    it('fetches the user profile when given a token', async () => {
      // Site status data is exposed in the user account response.
      // eslint-disable-next-line camelcase
      const site_status = { read_only: true, notice: 'some notice' };
      const user = createUserAccountResponse({
        id: 42,
        username: 'babar',
        site_status,
      });

      mockUsersApi
        .expects('currentUserAccount')
        .once()
        .returns(Promise.resolve(user));

      mockSiteApi.expects('getSiteStatus').never();

      function* appSagas() {
        yield all([fork(usersSaga), fork(siteSaga)]);
      }

      const token = userAuthSessionId();
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();
      const response = await testClient({
        connectedHistory,
        store,
        sagaMiddleware,
        appSagas,
      })
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="${token}"`);
      const { api, users, site } = store.getState();

      expect(response.statusCode).toEqual(200);
      expect(api.token).toEqual(token);
      expect(users.currentUserID).toEqual(42);
      expect(getCurrentUser(users).username).toEqual('babar');
      expect(site.readOnly).toEqual(site_status.read_only);
      expect(site.notice).toEqual(site_status.notice);
      mockSiteApi.verify();
      mockUsersApi.verify();
    });

    it('fetches the site status when there is no user token', async () => {
      const siteStatus = { read_only: true, notice: 'some notice' };

      mockSiteApi
        .expects('getSiteStatus')
        .once()
        .returns(Promise.resolve(siteStatus));

      mockUsersApi.expects('currentUserAccount').never();

      function* appSagas() {
        yield all([fork(usersSaga), fork(siteSaga)]);
      }

      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();
      const response = await testClient({
        connectedHistory,
        store,
        sagaMiddleware,
        appSagas,
      }).get('/en-US/firefox/');
      const { site } = store.getState();

      expect(response.statusCode).toEqual(200);
      expect(site.readOnly).toEqual(siteStatus.read_only);
      expect(site.notice).toEqual(siteStatus.notice);
      mockSiteApi.verify();
      mockUsersApi.verify();
    });

    it('gracefully handles site status API errors', async () => {
      mockSiteApi
        .expects('getSiteStatus')
        .once()
        .rejects(new Error('Oh no, an API error'));

      function* appSagas() {
        yield all([fork(usersSaga), fork(siteSaga)]);
      }

      const response = await testClient({ appSagas }).get('/en-US/firefox/');
      expect(response.statusCode).toEqual(200);
      mockSiteApi.verify();
    });

    it('returns a 500 error page when retrieving the user profile fails', async () => {
      mockUsersApi
        .expects('currentUserAccount')
        .once()
        .rejects(new Error('example of an API error'));

      const token = userAuthSessionId();
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();
      const response = await testClient({
        connectedHistory,
        store,
        sagaMiddleware,
        appSagas: usersSaga,
      })
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="${token}"`);
      expect(response.statusCode).toEqual(500);
      mockUsersApi.verify();
    });

    it('fetches the user profile even when SSR is disabled', async () => {
      const user = createUserAccountResponse({ id: 42, username: 'babar' });

      mockUsersApi
        .expects('currentUserAccount')
        .once()
        .returns(Promise.resolve(user));

      const token = userAuthSessionId();
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();
      const config = getFakeConfig({ disableSSR: true });

      const client = testClient({
        connectedHistory,
        store,
        sagaMiddleware,
        appSagas: usersSaga,
        config,
      });

      const response = await client
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="${token}"`);
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

    it('serializes the redux state in html', async () => {
      const user = createUserAccountResponse({ id: 42, username: 'babar' });

      mockUsersApi
        .expects('currentUserAccount')
        .once()
        .returns(Promise.resolve(user));

      const token = userAuthSessionId();
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();

      const client = testClient({
        connectedHistory,
        store,
        sagaMiddleware,
        appSagas: usersSaga,
      });

      const response = await client
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="${token}"`);
      const { api, users } = store.getState();

      // Parse the HTML response to retrieve the serialized redux state.
      const $ = cheerio.load(response.res.text);
      const reduxStoreState = JSON.parse($('#redux-store-state').html());

      expect(reduxStoreState.api).toEqual(api);
      expect(reduxStoreState.users).toMatchObject(users);
      mockUsersApi.verify();
    });

    it('performs a server redirect when requested by the app', async () => {
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas({
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
        connectedHistory,
        sagaMiddleware,
        store,
      });

      const response = await client.get(`/en-US/firefox/`);

      expect(response.status).toEqual(301);
      expect(response.headers.location).toEqual(newURL);
    });

    it('catches all errors and returns a 500', async () => {
      const _log = getFakeLogger();
      const _createHistory = () => {
        throw new Error('oops');
      };

      const response = await testClient({ _createHistory, _log }).get(
        '/en-US/firefox/',
      );
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

    it('catches a URIError from _createHistory and returns a 404', async () => {
      const _log = getFakeLogger();
      const _createHistory = () => {
        throw new URIError('oops');
      };

      const response = await testClient({ _createHistory, _log }).get(
        '/en-US/firefox/',
      );
      expect(response.statusCode).toEqual(404);

      sinon.assert.calledWith(
        _log.error,
        sinon.match(/Caught an error during createHistory: URIError: oops/),
      );
    });

    it('handles requests slightly differently when loaded page is anonymous', async () => {
      const url = '/en-US/firefox/';
      const config = getFakeConfig({ anonymousPagePatterns: [url] });
      const token = userAuthSessionId();
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();

      const response = await testClient({
        config,
        connectedHistory,
        store,
        sagaMiddleware,
      })
        .get(url)
        .set('cookie', `${config.get('cookieName')}="${token}"`);
      const { api, site } = store.getState();
      // It should not dispatch `setAuthToken()`.
      expect(response.statusCode).toEqual(200);
      expect(api.token).toEqual(null);
      // This means `loadedPageIsAnonymous()` has been dispatched.
      expect(site.loadedPageIsAnonymous).toEqual(true);
    });

    it('does not dispatch loadedPageIsAnonymous() when loaded page is not anoynmous', async () => {
      const config = getFakeConfig({ anonymousPagePatterns: [] });
      const token = userAuthSessionId();
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();

      await testClient({
        config,
        connectedHistory,
        store,
        sagaMiddleware,
      })
        .get('/en-US/firefox/')
        .set('cookie', `${config.get('cookieName')}="${token}"`);
      const { site } = store.getState();
      expect(site.loadedPageIsAnonymous).toEqual(false);
    });

    it('removes the cookie when user has been logged out', async () => {
      const token = userAuthSessionId();
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();
      const apiError = createApiError({ response: { status: 401 } });
      mockUsersApi.expects('currentUserAccount').once().rejects(apiError);

      const response = await testClient({
        connectedHistory,
        store,
        sagaMiddleware,
        appSagas: usersSaga,
      })
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="${token}"`);
      const { api, users } = store.getState();

      expect(response.statusCode).toEqual(200);
      const [auth_cookie, session_cookie] = response.headers['set-cookie'];
      expect(auth_cookie).toContain(
        `${defaultConfig.get('cookieName')}=; Max-Age=0;`,
      );
      expect(auth_cookie).toContain('Domain=.addons.mozilla.org;');
      expect(auth_cookie).toContain('Path=/;');
      expect(auth_cookie).toContain('HttpOnly; Secure; SameSite=Lax');
      expect(session_cookie).toContain(`sessionid=; Max-Age=0;`);
      expect(session_cookie).toContain('Domain=.addons.mozilla.org;');
      expect(session_cookie).toContain('Path=/;');
      expect(session_cookie).toContain('HttpOnly; Secure; SameSite=Lax');
      expect(api.token).toEqual(null);
      expect(users.currentUserWasLoggedOut).toEqual(true);
      mockUsersApi.verify();
    });

    it('sets correct Cache-Control header if request is safe & anonymous and response is sucessful', async () => {
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();

      const response = await testClient({
        connectedHistory,
        sagaMiddleware,
        store,
      }).get('/en-US/firefox/');
      expect(response.headers[X_ACCEL_EXPIRES_HEADER]).toEqual('360');
      expect(response.headers['cache-control']).toEqual(
        'max-age=0, s-maxage=360',
      );
    });

    it('sets correct Cache-Control header if request contained authentication cookie', async () => {
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();

      const response = await testClient({
        connectedHistory,
        sagaMiddleware,
        store,
      })
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="foo"`);
      expect(response.headers).not.toContain(X_ACCEL_EXPIRES_HEADER);
      expect(response.headers['cache-control']).toEqual(
        'max-age=0, s-maxage=0',
      );
    });

    it('sets correct Cache-Control header if request method is not safe', async () => {
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas();

      const response = await testClient({
        connectedHistory,
        sagaMiddleware,
        store,
      }).post('/en-US/firefox/');
      expect(response.headers).not.toContain(X_ACCEL_EXPIRES_HEADER);
      expect(response.headers['cache-control']).toEqual(
        'max-age=0, s-maxage=0',
      );
    });

    it('sets correct Cache-Control header if response is 404', async () => {
      const response = await testClient({ App: NotFoundApp }).get(
        '/en-US/firefox/simulation-of-a-non-existent-page/',
      );
      expect(response.statusCode).toEqual(404);
      expect(response.headers).not.toContain(X_ACCEL_EXPIRES_HEADER);
      expect(response.headers['cache-control']).toEqual(
        'max-age=0, s-maxage=0',
      );
    });

    it('sets correct Cache-Control header if response is 500', async () => {
      const _createHistory = () => {
        throw new Error('oops');
      };

      const response = await testClient({ _createHistory }).get(
        '/en-US/firefox/',
      );
      expect(response.statusCode).toEqual(500);
      expect(response.headers).not.toContain(X_ACCEL_EXPIRES_HEADER);
      expect(response.headers['cache-control']).toEqual('max-age=0');
    });

    it('sets correct Cache-Control header if request is safe & anonymous and response is redirect', async () => {
      const { connectedHistory, sagaMiddleware, store } = createStoreAndSagas({
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
        connectedHistory,
        sagaMiddleware,
        store,
      });

      const response = await client.get(`/en-US/firefox/`);

      expect(response.status).toEqual(301);
      expect(response.headers.location).toEqual(newURL);
      expect(response.headers[X_ACCEL_EXPIRES_HEADER]).toEqual('360');
      expect(response.headers['cache-control']).toEqual(
        'max-age=0, s-maxage=360',
      );
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
});
