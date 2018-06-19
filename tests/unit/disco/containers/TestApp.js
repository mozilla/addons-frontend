import * as React from 'react';
import { shallow } from 'enzyme';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-dom/test-utils';
import NestedStatus from 'react-nested-status';
import { Provider } from 'react-redux';

import { AppBase, mapStateToProps } from 'disco/containers/App';
import createStore from 'disco/store';
import { createApiError } from 'core/api';
import I18nProvider from 'core/i18n/Provider';
import { loadErrorPage } from 'core/reducers/errorPage';
import { fakeI18n } from 'tests/unit/helpers';

class MyComponent extends React.Component {
  render() {
    return <p>The component</p>;
  }
}

function renderProps(customProps = {}) {
  return {
    browserVersion: '50',
    i18n: fakeI18n(),
    store: createStore().store,
    ...customProps,
  };
}

function renderApp(customProps = {}) {
  const props = renderProps(customProps);
  const root = findRenderedComponentWithType(
    renderIntoDocument(
      <Provider store={props.store}>
        <I18nProvider i18n={props.i18n}>
          <AppBase {...props}>
            <MyComponent />
          </AppBase>
        </I18nProvider>
      </Provider>,
    ),
    AppBase,
  );
  return findDOMNode(root);
}

describe('App', () => {
  it('renders its children', () => {
    const rootNode = renderApp();
    expect(rootNode.tagName.toLowerCase()).toEqual('div');
    expect(rootNode.querySelector('p').textContent).toEqual('The component');
  });

  it('renders padding compensation class for FF < 50', () => {
    const rootNode = renderApp({ browserVersion: '49.0' });
    expect(rootNode.className).toContain('padding-compensation');
  });

  it('does not render padding compensation class for a bogus value', () => {
    const rootNode = renderApp({ browserVersion: 'whatever' });
    expect(rootNode.className).not.toContain('padding-compensation');
  });

  it('does not render padding compensation class for a undefined value', () => {
    const rootNode = renderApp({ browserVersion: undefined });
    expect(rootNode.className).not.toContain('padding-compensation');
  });

  it('does not render padding compensation class for FF == 50', () => {
    const rootNode = renderApp({ browserVersion: '50.0' });
    expect(rootNode.className).not.toContain('padding-compensation');
  });

  it('does not render padding compensation class for FF > 50', () => {
    const rootNode = renderApp({ browserVersion: '52.0a1' });
    expect(rootNode.className).not.toContain('padding-compensation');
  });

  it('renders a response with a 200 status', () => {
    const root = shallow(<AppBase {...renderProps()} />);
    expect(root.find(NestedStatus)).toHaveProp('code', 200);
  });
});

describe('App errors', () => {
  it('renders a 404', () => {
    const { store } = createStore();
    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 404 },
    });
    store.dispatch(loadErrorPage({ error }));

    const rootNode = renderApp({ store });
    expect(rootNode.textContent).not.toContain('The component');
    expect(rootNode.textContent).toContain('Page not found');
  });

  it('renders a generic error', () => {
    const { store } = createStore();
    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 500 },
    });
    store.dispatch(loadErrorPage({ error }));

    const rootNode = renderApp({ store });
    expect(rootNode.textContent).not.toContain('The component');
    expect(rootNode.textContent).toContain('Server Error');
  });
});

describe('mapStateToProps', () => {
  const fakeRouterParams = {
    params: {
      version: '49.0',
    },
  };

  it('returns browserVersion', () => {
    expect(mapStateToProps(null, fakeRouterParams).browserVersion).toEqual(
      '49.0',
    );
  });
});
