import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';

import Footer from 'amo/components/Footer';
import { getFakeI18nInst } from 'tests/client/helpers';
import I18nProvider from 'core/i18n/Provider';


describe('Footer', () => {
  function renderFooter({ ...props }) {
    return findRenderedComponentWithType(renderIntoDocument(
      <I18nProvider i18n={getFakeI18nInst()}>
        <Footer {...props} />
      </I18nProvider>
    ), Footer).getWrappedInstance();
  }

  it('renders a footer', () => {
    const root = renderFooter({
      lang: 'en-GB',
    });

    assert.equal(root.desktopLink.textContent, 'View desktop site');
    assert.equal(root.desktopLink.tagName, 'A');
  });
});
