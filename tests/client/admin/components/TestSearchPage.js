import React from 'react';

import AdminSearchPage from 'admin/components/SearchPage';
import AdminSearchForm from 'admin/components/SearchForm';
import Paginate from 'core/components/Paginate';
import { findAllByTag, findByTag, shallowRender } from 'tests/client/helpers';

describe('<AdminSearchPage />', () => {
  let props;

  function render(extra = {}) {
    return shallowRender(<AdminSearchPage {...{ ...props, ...extra }} />);
  }

  beforeEach(() => {
    props = {
      count: 80,
      page: 3,
      hasSearchParams: true,
      filters: { query: 'foo' },
      handleSearch: sinon.spy(),
      loading: false,
      results: [{ name: 'Foo', slug: 'foo' }, { name: 'Bar', slug: 'bar' }],
    };
  });

  it('has a nice heading', () => {
    const root = render();
    const heading = findByTag(root, 'h1');
    expect(heading.props.children).toEqual('Add-on Search');
  });

  it('renders the query', () => {
    const root = render();
    const form = findByTag(root, AdminSearchForm);
    expect(form.props).toEqual({
      pathname: '/search/',
      query: 'foo',
    });
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
});
