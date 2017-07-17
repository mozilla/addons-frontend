import React from 'react';
import Helmet from 'react-helmet';
import { Router, Route } from 'react-router';
import { createStore, combineReducers } from 'redux';
import { reducer as reduxAsyncConnect } from 'redux-connect';
import supertest from 'supertest';

import baseServer from 'core/server/base';
import FakeApp, { fakeAssets } from 'tests/unit/core/server/fakeApp';

describe('core/server/base', () => {
  const _helmentCanUseDOM = Helmet.canUseDOM;

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

  function testClient() {
    const stubRoutes = (
      <Router>
        <Route path="*" component={FakeApp} />
      </Router>
    );

    function createStoreAndSagas() {
      return {
        store: createStore(combineReducers({ reduxAsyncConnect })),
        sagaMiddleware: null,
      };
    }

    const app = baseServer(stubRoutes, createStoreAndSagas, {
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
  });
});
