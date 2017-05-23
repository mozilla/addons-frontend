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
    expect(results.props.count).toBe(props.count);
    expect(results.props.results).toBe(props.results);
    expect(results.props.hasSearchParams).toBe(props.hasSearchParams);
    expect(results.props.filters).toBe(props.filters);
    expect(results.props.loading).toBe(props.loading);
    expect(results.props.pathname).toBe(props.pathname);
    expect(Object.keys(results.props).sort()).toEqual([
      'count',
      'filters',
      'hasSearchParams',
      'loading',
      'pathname',
      'results',
    ].sort());
  });

  it('renders a Paginate', () => {
    const root = render();
    const paginator = findByTag(root, Paginate);
    expect(paginator.props.count).toEqual(80);
    expect(paginator.props.currentPage).toEqual(3);
    expect(paginator.props.pathname).toEqual('/search/');
    expect(paginator.props.queryParams).toEqual({ q: 'foo' });
  });

  it('does not render a Paginate when there is no search term', () => {
    const root = render({ filters: { query: null }, count: 0 });
    const paginators = findAllByTag(root, Paginate);
    expect(paginators).toEqual([]);
  });

  it('does render a SearchSort when there are filters and results', () => {
    const root = render();
    const sort = findByTag(root, SearchSort);
    expect(sort.props.filters).toEqual(props.filters);
    expect(sort.props.pathname).toEqual(props.pathname);
  });

  it('does not render a SearchSort when there are no filters', () => {
    const root = render({ hasSearchParams: false, results: [] });
    expect(() => findByTag(root, SearchSort))
      .toThrowError("Cannot read property 'type' of null");
  });

  it('does not render a SearchSort when there are no results', () => {
    const root = render({ hasSearchParams: true, results: [] });
    expect(() => findByTag(root, SearchSort))
      .toThrowError("Cannot read property 'type' of null");
  });

  it('does not render SearchSort when enableSearchSort is false', () => {
    const root = render({
      enableSearchSort: false,
      hasSearchParams: true,
    });
    expect(() => findByTag(root, SearchSort))
      .toThrowError("Cannot read property 'type' of null");
  });
});
