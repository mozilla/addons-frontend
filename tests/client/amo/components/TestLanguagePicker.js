import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';

import LanguagePicker from 'amo/components/LanguagePicker';
import { getFakeI18nInst } from 'tests/client/helpers';
import I18nProvider from 'core/i18n/Provider';


describe('LanguagePicker', () => {
  function renderLanguagePicker({ ...props }) {
    return findRenderedComponentWithType(renderIntoDocument(
      <I18nProvider i18n={getFakeI18nInst()}>
        <LanguagePicker {...props} />
      </I18nProvider>
    ), LanguagePicker).getWrappedInstance();
  }

  it('renders a LanguagePicker', () => {
    const root = renderLanguagePicker({
      lang: 'en-GB',
    });

    assert.equal(root.selector.tagName, 'SELECT');
  });
});
