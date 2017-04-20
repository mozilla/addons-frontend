import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';
import { loadFail } from 'redux-connect/lib/store';

import { AppBase, mapStateToProps } from 'disco/containers/App';
import createStore from 'disco/store';
import { createApiError } from 'core/api';
import I18nProvider from 'core/i18n/Provider';
import { getFakeI18nInst } from 'tests/client/helpers';


class MyComponent extends React.Component {
  render() {
    return <p>The component</p>;
  }
}

function renderApp(extraProps = {}, store = createStore()) {
  const props = {
    browserVersion: '50',
    i18n: getFakeI18nInst(),
    ...extraProps,
  };
  const root = findRenderedComponentWithType(renderIntoDocument(
    <Provider store={store}>
      <I18nProvider i18n={props.i18n}>
        <AppBase {...props}>
          <MyComponent />
        </AppBase>
      </I18nProvider>
    </Provider>
  ), AppBase);
  return findDOMNode(root);
}

describe('App', () => {
  it('renders its children', () => {
    const rootNode = renderApp();
    assert.equal(rootNode.tagName.toLowerCase(), 'div');
    assert.equal(rootNode.querySelector('p').textContent, 'The component');
  });

  it('renders padding compensation class for FF < 50', () => {
    const rootNode = renderApp({ browserVersion: '49.0' });
    assert.include(rootNode.className, 'padding-compensation');
  });

  it('does not render padding compensation class for a bogus value', () => {
    const rootNode = renderApp({ browserVersion: 'whatever' });
    assert.notInclude(rootNode.className, 'padding-compensation');
  });

  it('does not render padding compensation class for a undefined value', () => {
    const rootNode = renderApp({ browserVersion: undefined });
    assert.notInclude(rootNode.className, 'padding-compensation');
  });

  it('does not render padding compensation class for FF == 50', () => {
    const rootNode = renderApp({ browserVersion: '50.0' });
    assert.notInclude(rootNode.className, 'padding-compensation');
  });

  it('does not render padding compensation class for FF > 50', () => {
    const rootNode = renderApp({ browserVersion: '52.0a1' });
    assert.notInclude(rootNode.className, 'padding-compensation');
  });
});

describe('App errors', () => {
  it('renders a 404', () => {
    const store = createStore();
    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 404 },
    });
    store.dispatch(loadFail('ReduxKey', error));

    const rootNode = renderApp({}, store);
    assert.notInclude(rootNode.textContent, 'The component');
    assert.include(rootNode.textContent, 'Page not found');
  });

  it('renders a generic error', () => {
    const store = createStore();
    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 500 },
    });
    store.dispatch(loadFail('ReduxKey', error));

    const rootNode = renderApp({}, store);
    assert.notInclude(rootNode.textContent, 'The component');
    assert.include(rootNode.textContent, 'Server Error');
  });
});

describe('mapStateToProps', () => {
  const fakeRouterParams = {
    params: {
      version: '49.0',
    },
  };

  it('returns browserVersion', () => {
    assert.equal(mapStateToProps(null, fakeRouterParams).browserVersion, '49.0');
  });
});
