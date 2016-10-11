/* global btoa */

import React from 'react';
import { renderIntoDocument } from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import cookie from 'react-cookie';
import { createStore } from 'redux';

import HandleLogin, { mapDispatchToProps } from 'core/containers/HandleLogin';
import * as api from 'core/api';
import { userAuthToken } from 'tests/client/helpers';

describe('<HandleLogin />', () => {
  class MyRouter extends React.Component {
    static propTypes = {
      children: React.PropTypes.node.isRequired,
      router: React.PropTypes.object.isRequired,
    }

    static childContextTypes = {
      router: React.PropTypes.object,
    };

    getChildContext() {
      return { router: this.props.router };
    }

    render() {
      return this.props.children;
    }
  }

  function render(store, location, router) {
    return findDOMNode(renderIntoDocument(
      <Provider store={store}>
        <MyRouter router={router}>
          <HandleLogin location={location} />
        </MyRouter>
      </Provider>
    ));
  }

  describe('while loading', () => {
    const code = 'fxacode';
    const state = 'statedata:base64path';
    const location = { path: '/fxa-authenticate', query: { code, state } };
    const store = createStore((s = {}) => s, { api: {}, auth: {} });
    let mockApi;
    let router;

    beforeEach(() => {
      mockApi = sinon.mock(api);
      mockApi
        .expects('login')
        .withArgs({ api: {}, code, state })
        .returns(Promise.resolve());
      router = sinon.mock({ push: () => {} });
    });

    it('notifies the user that they are being logged in', () => {
      const root = render(store, location, router);
      assert.equal(root.textContent, 'Logging you in...');
    });

    it('sends the code and token to the api', () => {
      render(store, location, router);
      mockApi.verify();
    });
  });

  describe('when missing code or state', () => {
    const location = { pathname: '/', query: {} };
    const store = createStore((s = {}) => s, { api: {}, auth: {} });
    let router;
    let mockApi;

    beforeEach(() => {
      router = sinon.mock({});
      mockApi = sinon.mock(api);
      mockApi.expects('login').never();
    });

    it('gives an error', () => {
      const root = render(store, location, router);
      assert.equal(
        root.querySelector('p').textContent,
        'There was an error logging you in, please try again.');
    });

    it('shows a login link', () => {
      const root = render(store, location, router);
      const link = root.querySelector('a');
      assert.equal(link.pathname, '/api/v3/accounts/login/start/');
      assert.equal(link.textContent, 'Login');
    });

    it('does not call the API', () => {
      render(store, location, router);
      mockApi.verify();
    });
  });

  describe('loadData helper', () => {
    function setupData({ to } = {}) {
      const data = {
        apiConfig: {},
        dispatch: sinon.stub(),
        router: { push: () => {} },
        code: 'acodefromfxa',
        state: 'thestatefromamo',
        payload: { token: userAuthToken() },
      };
      if (to) {
        data.state += `:${btoa(to).replace(/=/g, '')}`;
      }
      data.location = { query: { code: data.code, state: data.state } };
      sinon.stub(api, 'login').withArgs({
        api: data.apiConfig,
        code: data.code,
        state: data.state,
      }).returns(Promise.resolve(data.payload));
      return data;
    }

    it('dispatches a SET_JWT event', () => {
      const { apiConfig, dispatch, location, payload, router } = setupData();
      const { loadData } = mapDispatchToProps(dispatch);
      return loadData({ api: apiConfig, location, router }).then(() => {
        assert(dispatch.calledOnce, 'dispatch not called');
        assert(dispatch.calledWith({ type: 'SET_JWT', payload }));
      });
    });

    it('stores the token in a cookie', () => {
      const { apiConfig, dispatch, location, payload: { token }, router } = setupData();
      const { loadData } = mapDispatchToProps(dispatch);
      const mockCookie = sinon.mock(cookie);
      mockCookie.expects('save').once().withArgs(
        'jwt_api_auth_token', token, { path: '/', secure: true, maxAge: 2592000 });
      return loadData({ api: apiConfig, location, router }).then(() => {
        mockCookie.verify();
      });
    });

    it('redirects to the root endpoint without a next path', () => {
      const { apiConfig, dispatch, location, router } = setupData();
      const { loadData } = mapDispatchToProps(dispatch);
      const mockRouter = sinon.mock(router);
      mockRouter
        .expects('push')
        .once()
        .withArgs({ pathname: '/' })
        .returns(null);
      return loadData({ api: apiConfig, location, router }).then(() => {
        mockRouter.verify();
      });
    });

    it('redirects to the next path', () => {
      const { apiConfig, dispatch, location, router } = setupData({ to: '/foo' });
      const { loadData } = mapDispatchToProps(dispatch);
      const mockRouter = sinon.mock(router);
      mockRouter
        .expects('push')
        .once()
        .withArgs({ pathname: '/foo' })
        .returns(null);
      return loadData({ api: apiConfig, location, router }).then(() => {
        mockRouter.verify();
      });
    });
  });
});
