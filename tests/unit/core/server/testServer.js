/* eslint-disable react/no-multi-comp */
import React from 'react';
import Helmet from 'react-helmet';
import { Router, Route } from 'react-router';
import { applyMiddleware, createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-connect';
import createSagaMiddleware from 'redux-saga';
import NestedStatus from 'react-nested-status';
import supertest from 'supertest';
import defaultConfig, { util as configUtil } from 'config';
import cheerio from 'cheerio';

import baseServer from 'core/server/base';
import apiReducer from 'core/reducers/api';
import redirectToReducer, {
  sendServerRedirect,
} from 'core/reducers/redirectTo';
import userReducer from 'core/reducers/user';
import userSaga from 'core/sagas/user';
import * as userApi from 'core/api/user';
import FakeApp, { fakeAssets } from 'tests/unit/core/server/fakeApp';
import { createUserProfileResponse, userAuthToken } from 'tests/unit/helpers';


describe(__filename, () => {
  let mockUserApi;

  const _helmetCanUseDOM = Helmet.canUseDOM;
  const stubRoutes = (
    <Router>
      <Route path="*" component={FakeApp} />
    </Router>
  );

  beforeEach(() => {
    Helmet.canUseDOM = false;
    global.webpackIsomorphicTools = {
      assets: () => fakeAssets,
    };
    mockUserApi = sinon.mock(userApi);
  });

  afterEach(() => {
    Helmet.canUseDOM = _helmetCanUseDOM;
    delete global.webpackIsomorphicTools;
  });

  function createStoreAndSagas({
    reducers = { reduxAsyncConnect, api: apiReducer, user: userReducer },
  } = {}) {
    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(
      combineReducers(reducers),
      // Do not define an initial state.
      undefined,
      applyMiddleware(sagaMiddleware),
    );

    return { store, sagaMiddleware };
  }

  function testClient({
    routes = stubRoutes,
    store = null,
    sagaMiddleware = null,
    appSagas = null,
    config = defaultConfig,
  } = {}) {
    function _createStoreAndSagas() {
      if (store === null) {
        return createStoreAndSagas();
      }

      return { store, sagaMiddleware };
    }

    // eslint-disable-next-line no-empty-function
    function* fakeSaga() {}

    const app = baseServer(routes, _createStoreAndSagas, {
      appSagas: appSagas || fakeSaga,
      appInstanceName: 'testapp',
      config,
    });
    return supertest(app);
  }

  describe('app', () => {
    it('varies on DNT', async () => {
      const response = await testClient().get('/en-US/firefox/').end();

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

      const notFoundStubRoutes = (
        <Router>
          <Route path="*" component={NotFound} />
        </Router>
      );

      const response = await testClient({ routes: notFoundStubRoutes })
        .get('/en-US/firefox/simulation-of-a-non-existent-page')
        .end();

      expect(response.statusCode).toEqual(404);
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

    it('fetches the user profile when given a token', async () => {
      const profile = createUserProfileResponse({ id: 42, username: 'babar' });

      mockUserApi
        .expects('userProfile')
        .once()
        .returns(Promise.resolve(profile));

      const token = userAuthToken();
      const { store, sagaMiddleware } = createStoreAndSagas();
      const response = await testClient({ store, sagaMiddleware, appSagas: userSaga })
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="${token}"`)
        .end();

      const { api, user } = store.getState();

      expect(response.statusCode).toEqual(200);
      expect(api.token).toEqual(token);
      expect(user.id).toEqual(42);
      expect(user.username).toEqual('babar');
      mockUserApi.verify();
    });

    it('returns a 500 error page when retrieving the user profile fails', async () => {
      mockUserApi
        .expects('userProfile')
        .once()
        .rejects(new Error('example of an API error'));

      const token = userAuthToken();
      const { store, sagaMiddleware } = createStoreAndSagas();
      const response = await testClient({ store, sagaMiddleware, appSagas: userSaga })
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="${token}"`)
        .end();

      expect(response.statusCode).toEqual(500);
      mockUserApi.verify();
    });

    it('fetches the user profile even when SSR is disabled', async () => {
      const profile = createUserProfileResponse({ id: 42, username: 'babar' });

      mockUserApi
        .expects('userProfile')
        .once()
        .returns(Promise.resolve(profile));

      const token = userAuthToken();
      const { store, sagaMiddleware } = createStoreAndSagas();
      // We use `cloneDeep()` to allow modifications on the `config` object,
      // since a call to `get()` makes it immutable. This is the case in the
      // previous test cases (on `defaultConfig`).
      const config = configUtil.cloneDeep(defaultConfig);
      config.disableSSR = true;

      const client = testClient({
        store,
        sagaMiddleware,
        appSagas: userSaga,
        config,
      });

      const response = await client
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="${token}"`)
        .end();

      const { api, user } = store.getState();

      expect(response.statusCode).toEqual(200);
      expect(api.token).toEqual(token);
      expect(user.id).toEqual(42);
      expect(user.username).toEqual('babar');
      mockUserApi.verify();

      // Parse the HTML response to retrieve the serialized redux state.
      // We do this here to make sure the sagas are actually run, because the
      // API token is retrieved from the cookie on the server, therefore the
      // user profile too.
      const $ = cheerio.load(response.res.text);
      const reduxStoreState = JSON.parse($('#redux-store-state').html());

      expect(reduxStoreState.api).toEqual(api);
      expect(reduxStoreState.user).toEqual(user);
    });

    it('it serializes the redux state in html', async () => {
      const profile = createUserProfileResponse({ id: 42, username: 'babar' });

      mockUserApi
        .expects('userProfile')
        .once()
        .returns(Promise.resolve(profile));

      const token = userAuthToken();
      const { store, sagaMiddleware } = createStoreAndSagas();

      const client = testClient({
        store,
        sagaMiddleware,
        appSagas: userSaga,
      });

      const response = await client
        .get('/en-US/firefox/')
        .set('cookie', `${defaultConfig.get('cookieName')}="${token}"`)
        .end();

      const { api, user } = store.getState();

      // Parse the HTML response to retrieve the serialized redux state.
      const $ = cheerio.load(response.res.text);
      const reduxStoreState = JSON.parse($('#redux-store-state').html());

      expect(reduxStoreState.api).toEqual(api);
      expect(reduxStoreState.user).toEqual(user);
      mockUserApi.verify();
    });

    it('performs a server redirect when requested by the app', async () => {
      const { store, sagaMiddleware } = createStoreAndSagas({
        reducers: {
          redirectTo: redirectToReducer,
          reduxAsyncConnect,
        },
      });
      const newURL = '/redirect/to/this/url';

      class Redirect extends React.Component {
        componentWillMount() {
          store.dispatch(sendServerRedirect({
            status: 301,
            url: newURL,
          }));
        }

        render() {
          return <p>a component that requests a server redirect</p>;
        }
      }

      const redirectRoutes = (
        <Router>
          <Route path="*" component={Redirect} />
        </Router>
      );

      const client = testClient({
        routes: redirectRoutes,
        sagaMiddleware,
        store,
      });

      const response = await client.get(`/en-US/firefox/`).end();

      expect(response.status).toEqual(301);
      expect(response.headers.location).toEqual(newURL);
    });
  });
});
