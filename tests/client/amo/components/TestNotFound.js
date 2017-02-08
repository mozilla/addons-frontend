import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import { loadFail } from 'redux-connect/lib/store';

import NotFound from 'amo/components/NotFound';
import createStore from 'amo/store';
import { createApiError } from 'core/api';
import I18nProvider from 'core/i18n/Provider';
import { signedInApiState } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('<NotFound />', () => {
  function render({ ...props }) {
    const store = createStore(signedInApiState);
    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 404 },
    });
    store.dispatch(loadFail('ReduxKey', error));

    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <NotFound {...props} />
        </I18nProvider>
      </Provider>
    ), NotFound));
  }

  it('renders a not found error', () => {
    const rootNode = render();

    assert.include(rootNode.textContent, 'Page not found');
  });
});
