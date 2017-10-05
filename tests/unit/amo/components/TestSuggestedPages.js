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
import { fakeI18n } from 'tests/unit/helpers';


describe('<SuggestedPages />', () => {
  function render({ ...props }) {
    const { store } = createStore();
    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={store}>
        <I18nProvider i18n={fakeI18n()}>
          <SuggestedPages {...props} />
        </I18nProvider>
      </Provider>
    ), SuggestedPages));
  }

  it('renders Suggested Pages', () => {
    const rootNode = render();

    expect(rootNode.textContent).toContain('Suggested Pages');
    expect(rootNode.textContent).toContain('Browse all extensions');
    // There should be three links on the page.
    expect(rootNode.querySelectorAll('a').length).toBe(3);
  });
});
