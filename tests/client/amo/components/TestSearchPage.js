import React from 'react';

import SearchPage from 'amo/components/SearchPage';
import SearchResults from 'amo/components/SearchResults';
import SearchSort from 'amo/components/SearchSort';
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
      pathname: '/search/',
      handleSearch: sinon.spy(),
      loading: false,
      results: [{ name: 'Foo', slug: 'foo' }, { name: 'Bar', slug: 'bar' }],
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
    assert.strictEqual(results.props.pathname, props.pathname);
    assert.deepEqual(
      Object.keys(results.props).sort(),
      [
        'count',
        'filters',
        'hasSearchParams',
        'loading',
        'pathname',
        'results',
      ].sort()
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

  it('does render a SearchSort when there are filters and results', () => {
    const root = render();
    const sort = findByTag(root, SearchSort);
    assert.equal(sort.props.filters, props.filters);
    assert.equal(sort.props.pathname, props.pathname);
  });

  it('does not render a SearchSort when there are no filters', () => {
    const root = render({ hasSearchParams: false, results: [] });
    assert.throws(() => findByTag(root, SearchSort), 'child is null');
  });

  it('does not render a SearchSort when there are no results', () => {
    const root = render({ hasSearchParams: true, results: [] });
    assert.throws(() => findByTag(root, SearchSort), 'child is null');
  });
});
