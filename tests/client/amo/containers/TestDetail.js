import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';

import { getFakeI18nInst } from 'tests/client/helpers';
import DetailPage from 'amo/containers/DetailPage';
import I18nProvider from 'core/i18n/Provider';
import translate from 'core/i18n/translate';

function renderDetailPage({ ...props }) {
  const MyDetailPage = translate({ withRef: true })(DetailPage);

  return findRenderedComponentWithType(renderIntoDocument(
    <I18nProvider i18n={getFakeI18nInst()}>
      <MyDetailPage {...props} />
    </I18nProvider>
  ), MyDetailPage).getWrappedInstance();
}


describe('DetailPage', () => {
  it('renders a heading', () => {
    const root = renderDetailPage();
    const rootNode = findDOMNode(root);
    assert.include(rootNode.querySelector('h1').textContent, 'Placeholder Add-on');
  });
});
