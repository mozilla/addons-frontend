import React from 'react';
import {
  renderIntoDocument as render,
  findRenderedComponentWithType,
} from 'react-addons-test-utils';

import SearchResults from 'admin/components/SearchResults';
import createStore from 'admin/store';


describe('<SearchResults />', () => {
  function renderResults(props) {
    return findRenderedComponentWithType(render(
      <SearchResults store={createStore()} {...props} />
    ), SearchResults).getWrappedInstance().getWrappedInstance();
  }

  it('renders empty search results container', () => {
    const root = renderResults();
    assert.include(root.message.textContent, 'enter a search term');
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

  it('renders a loading message when loading', () => {
    const root = renderResults({
      filters: { query: 'test' },
      hasSearchParams: true,
      loading: true,
    });
    assert.equal(root.message.textContent, 'Searching...');
  });
});
