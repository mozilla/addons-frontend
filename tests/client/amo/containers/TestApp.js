import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';
import { loadFail } from 'redux-connect/lib/store';

import {
  AppBase,
  mapDispatchToProps,
  mapStateToProps,
} from 'amo/containers/App';
import createStore from 'amo/store';
import {
  setClientApp,
  setLang,
  setUserAgent as setUserAgentAction,
} from 'core/actions';
import { createApiError } from 'core/api';
import DefaultErrorPage from 'core/components/ErrorPage';
import { INSTALL_STATE } from 'core/constants';
import I18nProvider from 'core/i18n/Provider';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('App', () => {
  class FakeErrorPageComponent extends React.Component {
    render() {
      // eslint-disable-next-line react/prop-types
      return <div>{this.props.children}</div>;
    }
  }

  // eslint-disable-next-line react/no-multi-comp
  class FakeFooterComponent extends React.Component {
    render() {
      return <footer />;
    }
  }

  // eslint-disable-next-line react/no-multi-comp
  class FakeMastHeadComponent extends React.Component {
    render() {
      // eslint-disable-next-line react/prop-types
      return <div>{this.props.children}</div>;
    }
  }

  // eslint-disable-next-line react/no-multi-comp
  class FakeSearchFormComponent extends React.Component {
    render() {
      return <form />;
    }
  }

  const FakeInfoDialogComponent = () => <div />;

  function render({ children = [], ...customProps } = {}) {
    const props = {
      i18n: getFakeI18nInst(),
      location: sinon.stub(),
      isAuthenticated: true,
      store: createStore(),
      ...customProps,
    };
    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={props.store}>
        <I18nProvider i18n={props.i18n}>
          <AppBase
            FooterComponent={FakeFooterComponent}
            InfoDialogComponent={FakeInfoDialogComponent}
            MastHeadComponent={FakeMastHeadComponent}
            SearchFormComponent={FakeSearchFormComponent}
            ErrorPage={FakeErrorPageComponent}
            setUserAgent={sinon.stub()}
            {...props}>
            {children}
          </AppBase>
        </I18nProvider>
      </Provider>
    ), AppBase);
  }

  it('renders its children', () => {
    // eslint-disable-next-line react/no-multi-comp
    class MyComponent extends React.Component {
      render() {
        return <p>The component</p>;
      }
    }
    const root = render({ children: [<MyComponent />] });
    const rootNode = findDOMNode(root);
    assert.equal(rootNode.tagName.toLowerCase(), 'div');
    assert.equal(rootNode.querySelector('p').textContent, 'The component');
  });

  it('sets the mamo cookie to "off"', () => {
    const fakeEvent = {
      preventDefault: sinon.stub(),
    };
    const fakeWindow = {
      location: {
        reload: sinon.stub(),
      },
    };
    const fakeCookieLib = {
      save: sinon.stub(),
    };

    const root = render();
    root.onViewDesktop(fakeEvent, { window_: fakeWindow, cookie_: fakeCookieLib });
    assert.ok(fakeEvent.preventDefault.called);
    assert.ok(fakeCookieLib.save.calledWith('mamo', 'off'));
    assert.ok(fakeWindow.location.reload.called);
  });

  it('sets isHomePage to true when on the root path', () => {
    const location = { pathname: '/en-GB/android/' };
    const root = render({ clientApp: 'android', lang: 'en-GB', location });

    assert.isTrue(root.mastHead.props.isHomePage);
  });

  it('sets isHomePage to true when on the root path without a slash', () => {
    const location = { pathname: '/en-GB/android' };
    const root = render({ clientApp: 'android', lang: 'en-GB', location });

    assert.isTrue(root.mastHead.props.isHomePage);
  });

  it('sets isHomePage to false when not on the root path', () => {
    const location = { pathname: '/en-GB/android/404/' };
    const root = render({
      clientApp: 'android', lang: 'en-GB', location });

    assert.isFalse(root.mastHead.props.isHomePage);
  });

  it('sets up a callback for setting add-on status', () => {
    const dispatch = sinon.spy();
    const { handleGlobalEvent } = mapDispatchToProps(dispatch);
    const payload = { guid: '@my-addon', status: 'some-status' };
    handleGlobalEvent(payload);
    assert.ok(dispatch.calledWith({ type: INSTALL_STATE, payload }));
  });

  it('sets up a callback for setting add-on status', () => {
    const dispatch = sinon.spy();
    const fakeSetUserAgent = sinon.stub();
    const { setUserAgent } = mapDispatchToProps(dispatch, fakeSetUserAgent);
    const userAgent = 'tofubrowser';

    setUserAgent(userAgent);
    assert.ok(dispatch.calledWith(fakeSetUserAgent()));
  });

  it('sets the clientApp as props', () => {
    const store = createStore();
    store.dispatch(setClientApp('android'));
    const { clientApp } = mapStateToProps(store.getState());
    assert.equal(clientApp, 'android');
  });

  it('sets the lang as props', () => {
    const store = createStore();
    store.dispatch(setLang('de'));
    const { lang } = mapStateToProps(store.getState());
    assert.equal(lang, 'de');
  });

  it('sets the userAgent as props', () => {
    const store = createStore();
    store.dispatch(setUserAgentAction('tofubrowser'));
    const { userAgent } = mapStateToProps(store.getState());
    assert.equal(userAgent, 'tofubrowser');
  });

  it('uses navigator.userAgent if userAgent prop is empty', () => {
    const setUserAgent = sinon.stub();
    const _navigator = { userAgent: 'Firefox 10000000.0' };
    render({ _navigator, setUserAgent, userAgent: '' });

    assert.equal(setUserAgent.firstCall.args[0], _navigator.userAgent);
  });

  it('renders an error component on error', () => {
    const store = createStore();
    const apiError = createApiError({
      apiURL: 'https://some-url',
      response: { status: 404 },
    });

    store.dispatch(loadFail('App', apiError));

    const root = render({
      ErrorPage: DefaultErrorPage,
      clientApp: 'android',
      lang: 'en-GB',
      location: { pathname: '/en-GB/android/' },
      store,
    });
    const rootNode = findDOMNode(root);

    assert.include(rootNode.textContent, 'Page not found');
  });
});
