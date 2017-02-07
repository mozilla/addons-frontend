import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import { loadFail } from 'redux-connect/lib/store';

import ServerError from 'amo/components/ServerError';
import createStore from 'amo/store';
import { createApiError } from 'core/api';
import I18nProvider from 'core/i18n/Provider';
import { signedInApiState } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('<ServerError />', () => {
  function render({ ...props }) {
    const store = createStore(signedInApiState);
    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 500 },
    });
    store.dispatch(loadFail('ReduxKey', error));

    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <ServerError {...props} />
        </I18nProvider>
      </Provider>
    ), ServerError));
  }

  it('renders a server error', () => {
    const rootNode = render();

    assert.include(rootNode.textContent,
      'but there was an error with our server and');
  });
});
