import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';
import { loadFail } from 'redux-connect/lib/store';

import NotAuthorized from 'amo/components/ErrorPage/NotAuthorized';
import { createApiError } from 'core/api';
import I18nProvider from 'core/i18n/Provider';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import { getFakeI18nInst } from 'tests/unit/helpers';


describe('<NotAuthorized />', () => {
  function render({ ...props }) {
    const { store } = dispatchSignInActions();
    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 401 },
    });
    store.dispatch(loadFail('ReduxKey', error));

    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <NotAuthorized {...props} />
        </I18nProvider>
      </Provider>
    ), NotAuthorized));
  }

  it('renders a not authorized error', () => {
    const rootNode = render();

    expect(rootNode.textContent).toContain('Not Authorized');
  });
});
