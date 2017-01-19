import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';
import { loadFail as reduxConnectLoadFail } from 'redux-connect/lib/store';

import {
  // eslint-disable-next-line import/no-named-default
  default as WrappedApp,
  AppBase,
  mapDispatchToProps,
  setupMapStateToProps,
} from 'amo/containers/App';
import createStore from 'amo/store';
import * as api from 'core/api';
import { INSTALL_STATE } from 'core/constants';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('App', () => {
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
      ...customProps,
    };
    return renderIntoDocument(
      <AppBase
        FooterComponent={FakeFooterComponent}
        InfoDialogComponent={FakeInfoDialogComponent}
        MastHeadComponent={FakeMastHeadComponent}
        SearchFormComponent={FakeSearchFormComponent}
        {...props}>
        {children}
      </AppBase>
    );
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

  it('shows a log in button', () => {
    const handleLogIn = sinon.spy();
    const location = sinon.stub();
    const root = render({ isAuthenticated: false, handleLogIn, location });
    const button = root.logInButton;
    assert.equal(button.textContent, 'Log in/Sign up');
    Simulate.click(button);
    assert.ok(handleLogIn.calledWith(location));
  });

  it('tells you if you are logged in', () => {
    const root = render({ isAuthenticated: true });
    assert.equal(root.logInButton.textContent, 'Log out');
  });

  it('updates the location on handleLogIn', () => {
    const _window = { location: '/foo' };
    const location = { pathname: '/bar', query: { q: 'wat' } };
    const startLoginUrlStub = sinon.stub(api, 'startLoginUrl').returns('https://a.m.org/login');
    const { handleLogIn } = setupMapStateToProps(_window)({
      auth: {},
      api: { lang: 'en-GB' },
    });
    handleLogIn(location);
    assert.equal(_window.location, 'https://a.m.org/login');
    assert.ok(startLoginUrlStub.calledWith({ location }));
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

  it('sets up a callback for setting add-on status', () => {
    const dispatch = sinon.spy();
    const { handleGlobalEvent } = mapDispatchToProps(dispatch);
    const payload = { guid: '@my-addon', status: 'some-status' };
    handleGlobalEvent(payload);
    assert.ok(dispatch.calledWith({ type: INSTALL_STATE, payload }));
  });

  it('renders redux-connect errors', () => {
    // This is just a sanity check to make sure the default component
    // is wrapped in handleResourceErrors
    const store = createStore();
    const apiError = api.createApiError({
      apiURL: 'https://some-url',
      response: { status: 404 },
    });
    store.dispatch(reduxConnectLoadFail('someKey', apiError));

    const root = renderIntoDocument(
      <WrappedApp store={store} />
    );

    const rootNode = findDOMNode(root);
    assert.include(rootNode.textContent, 'Not Found');
  });
});
