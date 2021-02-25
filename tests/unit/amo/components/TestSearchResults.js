import * as React from 'react';

import AddonsCard from 'amo/components/AddonsCard';
import SearchResults, { SearchResultsBase } from 'amo/components/SearchResults';
import {
  INSTALL_SOURCE_FEATURED,
  INSTALL_SOURCE_SEARCH,
  RECOMMENDED,
} from 'amo/constants';
import Paginate from 'amo/components/Paginate';
import {
  dispatchClientMetadata,
  fakeAddon,
  fakeI18n,
  shallowUntilTarget,
} from 'tests/unit/helpers';

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
      SearchResultsBase,
    );
  }

  it('renders no results when searched but nothing is found', () => {
    const root = render({
      count: 0,
      filters: { category: 'big-papa' },
      loading: false,
      results: [],
    });

    expect(root.find('.SearchResults-message')).toHaveText(
      'No results were found.',
    );
  });

  it('renders error when no results and valid query', () => {
    const root = render({
      count: 0,
      filters: { query: 'test' },
      results: [],
    });

    expect(root.find('.SearchResults-message')).toHaveText(
      'No results were found for "test".',
    );
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
    expect(root.find(AddonsCard)).toHaveProp('showFullSizePreview', true);
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
    expect(root.find(AddonsCard)).toHaveProp('showFullSizePreview', true);
  });

  it('sets add-on install source to search by default', () => {
    const root = render({
      filters: { query: 'ad blockers' },
      loading: false,
      results: [fakeAddon],
    });
    expect(root.find(AddonsCard)).toHaveProp(
      'addonInstallSource',
      INSTALL_SOURCE_SEARCH,
    );
  });

  it('sets add-on install source to recommended when approrpriate', () => {
    const root = render({
      filters: { query: 'ad blockers', promoted: RECOMMENDED },
      loading: false,
      results: [fakeAddon],
    });
    expect(root.find(AddonsCard)).toHaveProp(
      'addonInstallSource',
      INSTALL_SOURCE_FEATURED,
    );
  });

  it('passes a paginator as footer prop to the AddonsCard if supplied', () => {
    const paginator = <Paginate />;
    const root = render({ paginator });

    expect(root.find(AddonsCard)).toHaveProp('footer', paginator);
  });
});
