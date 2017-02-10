import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import SuggestedPages from 'amo/components/SuggestedPages';
import createStore from 'amo/store';
import I18nProvider from 'core/i18n/Provider';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('<SuggestedPages />', () => {
  function render({ ...props }) {
    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore()}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <SuggestedPages {...props} />
        </I18nProvider>
      </Provider>
    ), SuggestedPages));
  }

  it('renders Suggested Pages', () => {
    const rootNode = render();

    assert.include(rootNode.textContent, 'Suggested Pages');
    assert.include(rootNode.textContent, 'Browse all extensions');
    // There should be three links on the page.
    assert.lengthOf(rootNode.querySelectorAll('a'), 3);
  });
});
