import * as React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-dom/test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import NotAuthorized from 'amo/components/ErrorPage/NotAuthorized';
import { createApiError } from 'core/api';
import I18nProvider from 'core/i18n/Provider';
import { loadErrorPage } from 'core/reducers/errorPage';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import { fakeI18n } from 'tests/unit/helpers';

describe(__filename, () => {
  function render({ ...props }) {
    const { store } = dispatchSignInActions();
    const error = createApiError({
      apiURL: 'http://test.com',
      response: { status: 401 },
    });
    store.dispatch(loadErrorPage({ error }));

    return findDOMNode(
      findRenderedComponentWithType(
        renderIntoDocument(
          <Provider store={store}>
            <I18nProvider i18n={fakeI18n()}>
              <NotAuthorized {...props} />
            </I18nProvider>
          </Provider>,
        ),
        NotAuthorized,
      ),
    );
  }

  it('renders a not authorized error', () => {
    const rootNode = render();

    expect(rootNode.textContent).toContain('Not Authorized');
  });
});
