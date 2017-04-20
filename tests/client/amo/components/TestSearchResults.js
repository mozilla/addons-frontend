import React from 'react';
import {
  renderIntoDocument as render,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import SearchResults from 'amo/components/SearchResults';
import I18nProvider from 'core/i18n/Provider';
import { fakeAddon } from 'tests/client/amo/helpers';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('<SearchResults />', () => {
  function renderResults(props) {
    const initialState = { api: { clientApp: 'android', lang: 'en-GB' } };

    return findRenderedComponentWithType(render(
      <Provider store={createStore(initialState)}>
        <I18nProvider i18n={getFakeI18nInst()}>
          <SearchResults {...props} />
        </I18nProvider>
      </Provider>
    ), SearchResults).getWrappedInstance();
  }

  it('renders empty search results container', () => {
    const root = renderResults();
    assert.include(root.message.textContent, 'enter a search term');
  });

  it('renders no results if hasSearchParams is false', () => {
    const root = renderResults({
      hasSearchParams: false,
      loading: false,
      results: [fakeAddon],
    });
    assert.include(root.message.textContent, 'enter a search term');
    assert.notInclude(root.container.textContent, fakeAddon.name);
  });

  it('renders no results when searched but nothing is found', () => {
    const root = renderResults({
      count: 0,
      hasSearchParams: true,
      loading: false,
      results: [],
    });
    assert.include(root.message.textContent, 'No results were found');
  });

  it('renders error when no search params exist', () => {
    const root = renderResults({ hasSearchParams: false });
    assert.include(root.message.textContent, 'enter a search term');
  });

  it('renders error when no results and valid query', () => {
    const root = renderResults({
      filters: { query: 'test' },
      hasSearchParams: true,
    });
    assert.include(root.message.firstChild.textContent,
      'No results were found');
  });

  it('renders searching text during search', () => {
    const root = renderResults({
      filters: { query: 'test' },
      hasSearchParams: true,
      loading: true,
    });
    assert.equal(root.loadingText.textContent, 'Searching…');
  });
});
