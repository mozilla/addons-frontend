import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import Footer from 'amo/components/Footer';
import createStore from 'amo/store';
import { getFakeI18nInst } from 'tests/client/helpers';
import I18nProvider from 'core/i18n/Provider';


describe('Footer', () => {
  function renderFooter({ ...props }) {
    const initialState = { api: { clientApp: 'android', lang: 'en-GB' } };

    return findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore(initialState)}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <Footer {...props} />
        </I18nProvider>
      </Provider>
    ), Footer).getWrappedInstance();
  }

  it('renders a footer', () => {
    const root = renderFooter();

    assert.equal(root.desktopLink.textContent, 'View desktop site');
    assert.equal(root.desktopLink.tagName, 'A');
  });
});
