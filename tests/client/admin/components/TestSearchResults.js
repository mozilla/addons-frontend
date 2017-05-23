import React from 'react';
import {
  renderIntoDocument as render,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';

import SearchResults from 'admin/components/SearchResults';
import { getFakeI18nInst } from 'tests/client/helpers';


describe('<SearchResults />', () => {
  function renderResults(props) {
    return findRenderedComponentWithType(render(
      <SearchResults i18n={getFakeI18nInst()} {...props} />
    ), SearchResults).getWrappedInstance();
  }

  it('renders empty search results container', () => {
    const root = renderResults();
    expect(root.message.textContent).toContain('enter a search term');
  });

  it('renders no results when searched but nothing is found', () => {
    const root = renderResults({
      count: 0,
      hasSearchParams: true,
      loading: false,
      results: [],
    });
    expect(root.message.textContent).toContain('No results were found');
  });

  it('renders error when no search params exist', () => {
    const root = renderResults({ hasSearchParams: false });
    expect(root.message.textContent).toContain('enter a search term');
  });

  it('renders error when no results and valid query', () => {
    const root = renderResults({
      filters: { query: 'test' },
      hasSearchParams: true,
    });
    expect(root.message.firstChild.textContent).toContain('No results were found');
  });

  it('renders a loading message when loading', () => {
    const root = renderResults({
      filters: { query: 'test' },
      hasSearchParams: true,
      loading: true,
    });
    expect(root.message.textContent).toEqual('Searching...');
  });
});
