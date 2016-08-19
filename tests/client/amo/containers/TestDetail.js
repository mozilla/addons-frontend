import React from 'react';
import { findDOMNode } from 'react-dom';
import {
  findRenderedComponentWithType,
  renderIntoDocument,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import DetailPage from 'amo/containers/DetailPage';
import I18nProvider from 'core/i18n/Provider';
import { getFakeI18nInst } from 'tests/client/helpers';

import { fakeAddon } from '../components/TestAddonDetail';

function render(
  {
    props = { params: { slug: fakeAddon.slug } },
    state = {
      addons: {
        [fakeAddon.slug]: fakeAddon,
      },
    },
  } = {}
) {
  const store = createStore(state);

  return findRenderedComponentWithType(renderIntoDocument(
    <I18nProvider i18n={getFakeI18nInst()}>
      <Provider store={store}>
        <DetailPage {...props} />
      </Provider>
    </I18nProvider>
  ), DetailPage);
}


describe('DetailPage', () => {
  it('renders an add-on', () => {
    const root = render();
    const rootNode = findDOMNode(root);
    assert.include(rootNode.querySelector('h1').textContent,
                   `${fakeAddon.name} by ${fakeAddon.authors[0].name}`);
  });
});
