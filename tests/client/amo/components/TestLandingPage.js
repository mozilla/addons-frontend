import React from 'react';
import {
  renderIntoDocument,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { findDOMNode } from 'react-dom';
import { Provider } from 'react-redux';

import LandingPage from 'amo/components/LandingPage';
import createStore from 'amo/store';
import I18nProvider from 'core/i18n/Provider';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('<LandingPage />', () => {
  function render({ ...props }) {
    const initialState = { api: { clientApp: 'android', lang: 'en-GB' } };

    return findDOMNode(findRenderedComponentWithType(renderIntoDocument(
      <Provider store={createStore(initialState)}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <LandingPage {...props} />
        </I18nProvider>
      </Provider>
    ), LandingPage));
  }

  it('renders a LandingPage with no addons set', () => {
    const root = render({
      addonType: 'extension',
    });

    assert.include(root.textContent, 'Featured extensions');
    assert.include(root.textContent, 'More featured extensions');
  });

  it('renders a LandingPage with themes HTML', () => {
    const root = render({
      addonType: 'theme',
    });

    assert.include(root.textContent, 'Featured themes');
    assert.include(root.textContent, 'More featured themes');
  });

  it('renders each add-on when set', () => {
    const props = {
      addonType: 'theme',
      featuredAddons: [
        {
          authors: [{}],
          name: 'Howdy',
        },
        {
          authors: [{}],
          name: 'Howdy again',
        },
      ],
      highlyRatedAddons: [
        {
          authors: [{}],
          name: 'High',
        },
        {
          authors: [{}],
          name: 'High again',
        },
      ],
      popularAddons: [
        {
          authors: [{}],
          name: 'Pop',
        },
        {
          authors: [{}],
          name: 'Pop again',
        },
      ],
    };
    const root = render(props);

    assert.deepEqual(
      Object.values(root.querySelectorAll('.SearchResult-heading'))
        .map((heading) => heading.textContent),
      ['Howdy', 'Howdy again', 'Pop', 'Pop again', 'High', 'High again']
    );
  });
});
