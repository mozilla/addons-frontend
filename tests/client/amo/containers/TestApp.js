import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';

import { AppBase, setupMapStateToProps } from 'amo/containers/App';
import * as api from 'core/api';
import { getFakeI18nInst } from 'tests/client/helpers';


class FakeMastHeadComponent extends React.Component {
  render() {
    // eslint-disable-next-line react/prop-types
    return <div>{this.props.children}</div>;
  }
}


describe('App', () => {
  it('renders its children', () => {
    // eslint-disable-next-line react/no-multi-comp
    class MyComponent extends React.Component {
      render() {
        return <p>The component</p>;
      }
    }
    const i18n = getFakeI18nInst();
    const root = renderIntoDocument(
      <AppBase i18n={i18n} isAuthenticated
        MastHeadComponent={FakeMastHeadComponent}>
        <MyComponent />
      </AppBase>
    );

    const rootNode = findDOMNode(root);
    assert.equal(rootNode.tagName.toLowerCase(), 'div');
    assert.equal(rootNode.querySelector('p').textContent, 'The component');
  });

  it('shows a log in button', () => {
    const i18n = getFakeI18nInst();
    const handleLogIn = sinon.spy();
    const location = sinon.stub();
    const root = renderIntoDocument(
      <AppBase i18n={i18n} isAuthenticated={false}
        MastHeadComponent={FakeMastHeadComponent}
        handleLogIn={handleLogIn} location={location} />
    );
    const button = root.logInButton;
    assert.equal(button.textContent, 'Login/Sign up');
    Simulate.click(button);
    assert.ok(handleLogIn.calledWith(location));
  });

  it('tells you if you are logged in', () => {
    const i18n = getFakeI18nInst();
    const root = renderIntoDocument(<AppBase i18n={i18n}
      isAuthenticated MastHeadComponent={FakeMastHeadComponent} />);
    assert.equal(root.logInButton.textContent, 'Logout');
  });

  it('updates the location on handleLogIn', () => {
    const _window = { location: '/foo' };
    const location = { pathname: '/bar', query: { q: 'wat' } };
    const startLoginUrlStub = sinon.stub(api, 'startLoginUrl').returns('https://a.m.org/login');
    const { handleLogIn } = setupMapStateToProps(_window)({ auth: {} });
    handleLogIn(location);
    assert.equal(_window.location, 'https://a.m.org/login');
    assert.ok(startLoginUrlStub.calledWith({ location }));
  });
});
