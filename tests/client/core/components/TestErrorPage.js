import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import { loadFail } from 'redux-connect/lib/store';

import ErrorPage, { mapStateToProps } from 'core/components/ErrorPage';
import createStore from 'amo/store';
import { createApiError } from 'core/api';
import { getFakeI18nInst } from 'tests/client/helpers';
import I18nProvider from 'core/i18n/Provider';
import { signedInApiState } from 'tests/client/amo/helpers';


describe('<ErrorPage />', () => {
  function render({ ...props }, store = createStore(signedInApiState)) {
    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <ErrorPage {...props} />
        </I18nProvider>
      </Provider>
    ), ErrorPage));
  }

  it('renders children when there are no errors', () => {
    const rootNode = render({ children: <div>hello</div> });

    assert.equal(rootNode.textContent, 'hello');
  });

  it('renders an error page on error', () => {
    const store = createStore(signedInApiState);
    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 404 },
    });
    store.dispatch(loadFail('ReduxKey', error));

    const rootNode = render({ children: <div>hello</div> }, store);

    assert.notEqual(rootNode.textContent, 'hello');
    assert.include(rootNode.textContent, 'Error code: 404');
  });
});

describe('<ErrorPage mapStateToProps />', () => {
  it('returns errorPage from state', () => {
    assert.deepEqual(
      mapStateToProps({ errorPage: 'howdy' }), { errorPage: 'howdy' });
  });
});
