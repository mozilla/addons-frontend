import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import Footer from 'amo/components/Footer';
import createStore from 'amo/store';
import { getFakeI18nInst } from 'tests/client/helpers';
import I18nProvider from 'core/i18n/Provider';


describe('Footer', () => {
  function renderFooter({ ...props }) {
    const initialState = { api: { clientApp: 'android', lang: 'en-GB' } };

    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore(initialState)}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <Footer {...props} />
        </I18nProvider>
      </Provider>
    ), Footer));
  }

  it('renders a footer', () => {
    const root = renderFooter();

    assert.equal(root.querySelector('.Footer-privacy').textContent,
      'Privacy policy');
    assert.equal(root.querySelector('.Footer-privacy').href,
      'https://www.mozilla.org/en-GB/privacy/websites/');

    assert.equal(root.querySelector('.Footer-legal').textContent,
      'Legal notices');
    assert.equal(root.querySelector('.Footer-legal').href,
      'https://www.mozilla.org/en-GB/about/legal/');
  });
});
