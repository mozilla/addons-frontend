import React from 'react';

import SearchPage from 'amo/components/SearchPage';
import SearchResult from 'amo/components/SearchResult';
import SearchResults from 'core/components/Search/SearchResults';
import Paginate from 'core/components/Paginate';
import { findAllByTag, findByTag, shallowRender } from 'tests/client/helpers';


describe('<SearchPage />', () => {
  let props;

  function render(extra = {}) {
    return shallowRender(<SearchPage {...{ ...props, ...extra }} />);
  }

  beforeEach(() => {
    props = {
      count: 80,
      filters: { query: 'foo' },
      hasSearchParams: true,
      page: 3,
      handleSearch: sinon.spy(),
      loading: false,
      results: [{ name: 'Foo', slug: 'foo' }, { name: 'Bar', slug: 'bar' }],
      ResultComponent: SearchResult,
    };
  });

  it('renders the results', () => {
    const root = render();
    const results = findByTag(root, SearchResults);
    assert.strictEqual(results.props.count, props.count);
    assert.strictEqual(results.props.results, props.results);
    assert.strictEqual(results.props.hasSearchParams, props.hasSearchParams);
    assert.strictEqual(results.props.filters, props.filters);
    assert.strictEqual(results.props.loading, props.loading);
    assert.strictEqual(results.props.ResultComponent, props.ResultComponent);
    assert.deepEqual(
      Object.keys(results.props).sort(),
      ['count', 'filters', 'hasSearchParams', 'loading', 'results',
        'ResultComponent'].sort()
    );
  });

  it('renders a Paginate', () => {
    const root = render();
    const paginator = findByTag(root, Paginate);
    assert.equal(paginator.props.count, 80);
    assert.equal(paginator.props.currentPage, 3);
    assert.equal(paginator.props.pathname, '/search/');
    assert.deepEqual(paginator.props.queryParams, { q: 'foo' });
  });

  it('does not render a Paginate when there is no search term', () => {
    const root = render({ filters: { query: null }, count: 0 });
    const paginators = findAllByTag(root, Paginate);
    assert.deepEqual(paginators, []);
  });
});
