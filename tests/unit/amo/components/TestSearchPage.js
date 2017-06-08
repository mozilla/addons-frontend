import { shallow } from 'enzyme';
import React from 'react';

import SearchPage from 'amo/components/SearchPage';
import SearchResults from 'amo/components/SearchResults';
import SearchSort from 'amo/components/SearchSort';
import { setViewContext } from 'amo/actions/viewContext';
import Paginate from 'core/components/Paginate';
import { ADDON_TYPE_EXTENSION, VIEW_CONTEXT_EXPLORE } from 'core/constants';


describe('<SearchPage />', () => {
  let props;

  function render(extra = {}) {
    return shallow(<SearchPage {...{ ...props, ...extra }} />);
  }

  beforeEach(() => {
    props = {
      count: 80,
      dispatch: sinon.stub(),
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
    const results = root.find(SearchResults);
    expect(results.prop('count')).toEqual(props.count);
    expect(results.prop('results')).toEqual(props.results);
    expect(results.prop('hasSearchParams')).toEqual(props.hasSearchParams);
    expect(results.prop('filters')).toEqual(props.filters);
    expect(results.prop('loading')).toEqual(props.loading);
    expect(results.prop('pathname')).toEqual(props.pathname);
    expect(Object.keys(results.props()).sort()).toEqual([
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
    const paginator = root.find(Paginate);
    expect(paginator.prop('count')).toEqual(80);
    expect(paginator.prop('currentPage')).toEqual(3);
    expect(paginator.prop('pathname')).toEqual('/search/');
    expect(paginator.prop('queryParams')).toEqual({ q: 'foo' });
  });

  it('does not render a Paginate when there is no search term', () => {
    const root = render({ filters: { query: null }, count: 0 });
    const paginators = root.find(Paginate);

    expect(paginators.length).toEqual(0);
  });

  it('does render a SearchSort when there are filters and results', () => {
    const root = render();
    const sort = root.find(SearchSort);

    expect(sort.prop('filters')).toEqual(props.filters);
    expect(sort.prop('pathname')).toEqual(props.pathname);
  });

  it('does not render a SearchSort when there are no filters', () => {
    const root = render({ hasSearchParams: false, results: [] });
    const searchSort = root.find(SearchSort);

    expect(searchSort.length).toEqual(0);
  });

  it('does not render a SearchSort when there are no results', () => {
    const root = render({ hasSearchParams: true, results: [] });
    const searchSort = root.find(SearchSort);

    expect(searchSort.length).toEqual(0);
  });

  it('does not render SearchSort when enableSearchSort is false', () => {
    const root = render({
      enableSearchSort: false,
      hasSearchParams: true,
    });
    const searchSort = root.find(SearchSort);

    expect(searchSort.length).toEqual(0);
  });

  it('sets the viewContext to the addonType if addonType exists', () => {
    const fakeDispatch = sinon.stub();
    const filters = { addonType: ADDON_TYPE_EXTENSION, query: 'test' };

    render({ count: 0, dispatch: fakeDispatch, filters });

    expect(
      fakeDispatch.calledWith(setViewContext(ADDON_TYPE_EXTENSION))
    ).toBe(true);
  });

  it('sets the viewContext to exploring if no addonType found', () => {
    const fakeDispatch = sinon.stub();
    const filters = { query: 'test' };

    render({ count: 0, dispatch: fakeDispatch, filters });

    expect(
      fakeDispatch.calledWith(setViewContext(VIEW_CONTEXT_EXPLORE))
    ).toBe(true);
  });
});
