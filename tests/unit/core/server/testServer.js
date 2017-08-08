import React from 'react';
import Helmet from 'react-helmet';
import { Router, Route } from 'react-router';
import { applyMiddleware, createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-connect';
import createSagaMiddleware from 'redux-saga';
import NestedStatus from 'react-nested-status';
import supertest from 'supertest';

import baseServer from 'core/server/base';
import FakeApp, { fakeAssets } from 'tests/unit/core/server/fakeApp';

describe('core/server/base', () => {
  const _helmentCanUseDOM = Helmet.canUseDOM;
  const defaultStubRoutes = (
    <Router>
      <Route path="*" component={FakeApp} />
    </Router>
  );

  beforeEach(() => {
    Helmet.canUseDOM = false;
    global.webpackIsomorphicTools = {
      assets: () => fakeAssets,
    };
  });

  afterEach(() => {
    Helmet.canUseDOM = _helmentCanUseDOM;
    delete global.webpackIsomorphicTools;
  });

  function testClient({ stubRoutes = defaultStubRoutes } = {}) {
    function createStoreAndSagas() {
      const sagaMiddleware = createSagaMiddleware();
      return {
        store: createStore(
          combineReducers({ reduxAsyncConnect }),
          undefined,
          applyMiddleware(sagaMiddleware),
        ),
        sagaMiddleware,
      };
    }

    // eslint-disable-next-line no-empty-function
    function* fakeSaga() {}

    const app = baseServer(stubRoutes, createStoreAndSagas, {
      appSagas: fakeSaga,
      appInstanceName: 'testapp',
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

      const stubRoutes = (
        <Router>
          <Route path="*" component={NotFound} />
        </Router>
      );

      const response = await testClient({ stubRoutes })
        .get('/en-US/firefox/simulation-of-a-non-existent-page').end();

      expect(response.statusCode).toEqual(404);
    });
  });
});
