import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
  Simulate,
} from 'react-addons-test-utils';

import App, { makeMapStateToProps, AppBase } from 'amo/containers/App';
import { startLoginUrl } from 'core/api';
import I18nProvider from 'core/i18n/Provider';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('App', () => {
  it('renders its children', () => {
    class MyComponent extends React.Component {
      render() {
        return <p>The component</p>;
      }
    }
    const root = findRenderedComponentWithType(renderIntoDocument(
      <I18nProvider i18n={getFakeI18nInst()}>
        <App>
          <MyComponent />
        </App>
      </I18nProvider>), App).getWrappedInstance();

    const rootNode = findDOMNode(root);
    assert.equal(rootNode.tagName.toLowerCase(), 'div');
    assert.equal(rootNode.querySelector('p').textContent, 'The component');
  });

  it('shows a log in button', () => {
    const i18n = getFakeI18nInst();
    const handleLogIn = sinon.spy();
    const root = renderIntoDocument(
      <AppBase i18n={i18n} isAuthenticated={false} handleLogIn={handleLogIn} />
    );
    const button = findDOMNode(root).querySelector('footer button');
    assert.equal(button.textContent, 'Log in');
    Simulate.click(button);
    assert.ok(handleLogIn.called);
  });

  it('tells you if you are logged in', () => {
    const i18n = getFakeI18nInst();
    const root = renderIntoDocument(<AppBase i18n={i18n} isAuthenticated />);
    assert.equal(findDOMNode(root).querySelector('footer').textContent, 'You are logged in');
  });

  it('updates the location on handleLogIn', () => {
    const _window = { location: '/' };
    const { handleLogIn } = makeMapStateToProps({ _window })({ auth: {} });
    handleLogIn();
    assert.equal(_window.location, startLoginUrl());
  });
});
