import { createMemoryHistory } from 'history';
import * as React from 'react';
import { shallow } from 'enzyme';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-dom/test-utils';
import NestedStatus from 'react-nested-status';
import { Provider } from 'react-redux';
import { Router } from 'react-router-dom';

import App, { AppBase } from 'disco/components/App';
import createStore from 'disco/store';
import { createApiError } from 'core/api';
import I18nProvider from 'core/i18n/Provider';
import { loadErrorPage } from 'core/reducers/errorPage';
import { fakeI18n } from 'tests/unit/helpers';

function renderApp({ browserVersion = '50', ...customProps } = {}) {
  const history = createMemoryHistory({
    initialEntries: [
      `/en-US/firefox/discovery/pane/${browserVersion}/Darwin/normal/`,
    ],
  });

  const store = customProps.store || createStore({ history }).store;

  const root = findRenderedComponentWithType(
    renderIntoDocument(
      <Provider store={store}>
        <I18nProvider i18n={fakeI18n()}>
          <Router history={history}>
            <App {...customProps} />
          </Router>
        </I18nProvider>
      </Provider>,
    ),
    AppBase,
  );

  return findDOMNode(root);
}

describe(__filename, () => {
  describe('App', () => {
    it('renders correctly', () => {
      const rootNode = renderApp();
      expect(rootNode.textContent).toContain('Personalize Your Firefox');
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
      const root = shallow(<AppBase i18n={fakeI18n()} browserVersion="50" />);
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
      expect(rootNode.textContent).not.toContain('Discover Add-ons');
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
      expect(rootNode.textContent).not.toContain('Discover Add-ons');
      expect(rootNode.textContent).toContain('Server Error');
    });
  });
});
