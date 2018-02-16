import * as React from 'react';
import {
  renderIntoDocument as render,
  findRenderedComponentWithType,
} from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import createStore from 'amo/store';
import AddonsCard from 'amo/components/AddonsCard';
import SearchResults from 'amo/components/SearchResults';
import I18nProvider from 'core/i18n/Provider';
import { fakeAddon } from 'tests/unit/amo/helpers';
import { fakeI18n } from 'tests/unit/helpers';
import { SEARCH_SORT_UPDATED } from 'core/constants';


describe('<SearchResults />', () => {
  function renderResults(props) {
    const initialState = { api: { clientApp: 'android', lang: 'en-GB' } };
    const { store } = createStore({ initialState });

    return findRenderedComponentWithType(render(
      <Provider store={store}>
        <I18nProvider i18n={fakeI18n()}>
          <SearchResults {...props} />
        </I18nProvider>
      </Provider>
    ), SearchResults).getWrappedInstance();
  }

  it('renders empty search results container', () => {
    const root = renderResults();

    expect(root.message.textContent).toContain('enter a search term');
  });

  it('renders no results when searched but nothing is found', () => {
    const root = renderResults({
      count: 0,
      filters: { category: 'big-papa' },
      loading: false,
      results: [],
    });

    expect(root.message.textContent).toContain('No results were found.');
  });

  it('renders error when no search params exist', () => {
    const root = renderResults({ filters: {} });
    const addonsCard = findRenderedComponentWithType(root, AddonsCard);

    expect(root.message.textContent).toContain('enter a search term');
    expect(addonsCard.props.addons).toEqual(null);
  });

  it('renders error when no results and valid query', () => {
    const root = renderResults({
      count: 0,
      filters: { query: 'test' },
      results: [],
    });

    expect(root.message.firstChild.textContent).toContain(
      'No results were found');
  });

  it('renders searching text during search', () => {
    const root = renderResults({
      filters: { query: 'test' },
      loading: true,
    });

    expect(root.loadingText.textContent).toEqual('Searching…');
  });

  it('renders search result placeholders while loading', () => {
    const root = renderResults({
      filters: { query: 'test' },
      loading: true,
    });
    const addonsCard = findRenderedComponentWithType(root, AddonsCard);

    // Make sure it just renders AddonsCard in a loading state.
    expect(addonsCard.props.addons).toEqual([]);
    expect(addonsCard.props.loading).toEqual(true);
  });

  it('renders results', () => {
    const results = [
      fakeAddon,
      { ...fakeAddon, id: 3753735, slug: 'new-slug' },
    ];
    const root = renderResults({
      filters: { query: 'test' },
      loading: false,
      results,
    });
    const addonsCard = findRenderedComponentWithType(root, AddonsCard);

    expect(addonsCard.props.addons).toEqual(results);
    expect(addonsCard.props.loading).toEqual(false);
  });

  it('passes the correct value for sortedByDate to AddonsCard', () => {
    const root = renderResults({
      filters: { query: 'test', sort: SEARCH_SORT_UPDATED },
    });
    const addonsCard = findRenderedComponentWithType(root, AddonsCard);

    expect(addonsCard.props.sortedByDate).toEqual(true);
  });
});
