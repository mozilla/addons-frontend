import * as React from 'react';

import AddonsCard from 'amo/components/AddonsCard';
import SearchResults, {
  SearchResultsBase,
} from 'amo/components/SearchResults';
import Paginate from 'core/components/Paginate';
import { dispatchClientMetadata, fakeAddon } from 'tests/unit/amo/helpers';
import { fakeI18n, shallowUntilTarget } from 'tests/unit/helpers';


describe(__filename, () => {
  function render(props = {}) {
    const allProps = {
      i18n: fakeI18n(),
      paginator: null,
      store: dispatchClientMetadata().store,
      ...props,
    };

    return shallowUntilTarget(
      <SearchResults {...allProps} />,
      SearchResultsBase
    );
  }

  it('renders empty search results container', () => {
    const root = render();

    expect(root.find('.SearchResults-message'))
      .toHaveText('Please enter a search term to search Firefox Add-ons.');
  });

  it('renders no results when searched but nothing is found', () => {
    const root = render({
      count: 0,
      filters: { category: 'big-papa' },
      loading: false,
      results: [],
    });

    expect(root.find('.SearchResults-message'))
      .toHaveText('No results were found.');
  });

  it('renders error when no search params exist', () => {
    const root = render({ filters: {} });

    expect(root.find('.SearchResults-message'))
      .toHaveText('Please enter a search term to search Firefox Add-ons.');
    expect(root.find(AddonsCard)).toHaveProp('addons', null);
  });

  it('renders error when no results and valid query', () => {
    const root = render({
      count: 0,
      filters: { query: 'test' },
      results: [],
    });

    expect(root.find('.SearchResults-message'))
      .toHaveText('No results were found for "test".');
  });

  it('renders searching text during search', () => {
    const root = render({
      filters: { query: 'test' },
      loading: true,
    });

    expect(root).toIncludeText('Searching…');
  });

  it('renders search result placeholders while loading', () => {
    const root = render({
      filters: { query: 'test' },
      loading: true,
    });

    // Make sure it just renders AddonsCard in a loading state.
    expect(root.find(AddonsCard)).toHaveProp('addons', []);
    expect(root.find(AddonsCard)).toHaveProp('loading', true);
  });

  it('renders results', () => {
    const results = [
      fakeAddon,
      { ...fakeAddon, id: 3753735, slug: 'new-slug' },
    ];
    const root = render({
      filters: { query: 'test' },
      loading: false,
      results,
    });

    expect(root.find(AddonsCard)).toHaveProp('addons', results);
    expect(root.find(AddonsCard)).toHaveProp('loading', false);
  });

  it('passes a paginator as footer prop to the AddonsCard if supplied', () => {
    const paginator = <Paginate />;
    const root = render({ paginator });

    expect(root.find(AddonsCard)).toHaveProp('footer', paginator);
  });
});
