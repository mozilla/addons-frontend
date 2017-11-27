import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import ErrorPage, { mapStateToProps } from 'core/components/ErrorPage';
import { createApiError } from 'core/api';
import { loadErrorPage } from 'core/reducers/errorPage';
import { fakeI18n } from 'tests/unit/helpers';
import I18nProvider from 'core/i18n/Provider';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';


describe('<ErrorPage />', () => {
  function render({ ...props }, store = dispatchSignInActions().store) {
    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <I18nProvider i18n={fakeI18n()}>
          <ErrorPage {...props} />
        </I18nProvider>
      </Provider>
    ), ErrorPage));
  }

  it('renders children when there are no errors', () => {
    const rootNode = render({ children: <div>hello</div> });

    expect(rootNode.textContent).toEqual('hello');
  });

  it('renders an error page on error', () => {
    const { store } = dispatchSignInActions();
    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 404 },
    });
    store.dispatch(loadErrorPage({ error }));

    const rootNode = render({ children: <div>hello</div> }, store);

    expect(rootNode.textContent).not.toEqual('hello');
    expect(rootNode.textContent).toContain('Error code: 404');
  });
});

describe('<ErrorPage mapStateToProps />', () => {
  it('returns errorPage from state', () => {
    expect(mapStateToProps({ errorPage: 'howdy' }))
      .toEqual({ errorPage: 'howdy' });
  });
});
