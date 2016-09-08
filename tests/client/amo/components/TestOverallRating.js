import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';

import OverallRating from 'amo/components/OverallRating';
import I18nProvider from 'core/i18n/Provider';
import { getFakeI18nInst } from 'tests/client/helpers';

function render({ addonName = 'the-addon-name', ...customProps } = {}) {
  const i18n = getFakeI18nInst();
  const props = { i18n, addonName, ...customProps };

  const root = findRenderedComponentWithType(renderIntoDocument(
    <I18nProvider i18n={i18n}>
      <OverallRating {...props} />
    </I18nProvider>
  ), OverallRating);

  return findDOMNode(root);
}

describe('OverallRating', () => {
  it('prompts you to rate an add-on', () => {
    const rootNode = render({ addonName: 'some-addon' });
    assert.include(rootNode.querySelector('p').textContent,
                   'some-addon');
  });
});
