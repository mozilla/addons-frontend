import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';

import { AppBase, setupMapStateToProps } from 'amo/containers/App';
import * as api from 'core/api';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('App', () => {
  it('renders its children', () => {
    class MyComponent extends React.Component {
      render() {
        return <p>The component</p>;
      }
    }
    const i18n = getFakeI18nInst();
    const root = renderIntoDocument(
      <AppBase i18n={i18n} isAuthenticated>
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
      <AppBase i18n={i18n} isAuthenticated={false} handleLogIn={handleLogIn} location={location} />
    );
    const button = root.logInButton;
    assert.equal(button.textContent, 'Log in');
    Simulate.click(button);
    assert.ok(handleLogIn.calledWith(location));
  });

  it('tells you if you are logged in', () => {
    const i18n = getFakeI18nInst();
    const root = renderIntoDocument(<AppBase i18n={i18n} isAuthenticated />);
    assert.equal(findDOMNode(root).querySelector('footer').textContent, 'You are logged in');
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
