import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';

import LanguagePicker from 'amo/components/LanguagePicker';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('LanguagePicker', () => {
  function renderLanguagePicker({ ...props }) {
    return findRenderedComponentWithType(renderIntoDocument(
      <LanguagePicker i18n={getFakeI18nInst()} {...props} />
    ), LanguagePicker).getWrappedInstance();
  }

  it('renders a LanguagePicker', () => {
    const root = renderLanguagePicker();

    assert.equal(root.selector.tagName, 'SELECT');
  });
});
