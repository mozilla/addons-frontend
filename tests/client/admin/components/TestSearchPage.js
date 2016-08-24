import React from 'react';

import SearchPage from 'admin/components/SearchPage';
import SearchResults from 'admin/components/SearchResults';
import SearchForm from 'admin/components/SearchForm';
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
      page: 3,
      handleSearch: sinon.spy(),
      loading: false,
      results: [{ name: 'Foo', slug: 'foo' }, { name: 'Bar', slug: 'bar' }],
      query: 'foo',
    };
  });

  it('has a nice heading', () => {
    const root = render();
    const heading = findByTag(root, 'h1');
    assert.equal(heading.props.children, 'Add-on Admin: Search');
  });

  it('renders the results', () => {
    const root = render();
    const results = findByTag(root, SearchResults);
    assert.strictEqual(results.props.count, props.count);
    assert.strictEqual(results.props.results, props.results);
    assert.strictEqual(results.props.query, props.query);
    assert.strictEqual(results.props.loading, props.loading);
    assert.deepEqual(
      Object.keys(results.props).sort(),
      ['count', 'loading', 'results', 'query'].sort());
  });

  it('renders the query', () => {
    const root = render();
    const form = findByTag(root, SearchForm);
    assert.deepEqual(form.props, {
      pathname: '/admin/',
      query: 'foo',
    });
  });

  it('renders a Paginate', () => {
    const root = render();
    const paginator = findByTag(root, Paginate);
    assert.equal(paginator.props.count, 80);
    assert.equal(paginator.props.currentPage, 3);
    assert.equal(paginator.props.pathname, '/admin/');
    assert.deepEqual(paginator.props.query, { q: 'foo' });
  });

  it('does not render a Paginate when there is no search term', () => {
    const root = render({ query: null, count: 0 });
    const paginators = findAllByTag(root, Paginate);
    assert.deepEqual(paginators, []);
  });
});
