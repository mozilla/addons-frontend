import React from 'react';

import SearchPage from 'amo/components/SearchPage';
import SearchResult from 'amo/components/SearchResult';
import SearchForm from 'amo/components/SearchForm';
import SearchResults from 'core/components/Search/SearchResults';
import Paginate from 'core/components/Paginate';
import { findAllByTag, findByTag, shallowRender } from 'tests/client/helpers';

describe('<SearchPage />', () => {
  let props;

  function render(extra = {}) {
    return shallowRender(
      <SearchPage {...{ ...props, ...extra }} />);
  }

  beforeEach(() => {
    props = {
      count: 80,
      page: 3,
      handleSearch: sinon.spy(),
      lang: 'en-GB',
      loading: false,
      results: [{ name: 'Foo', slug: 'foo' }, { name: 'Bar', slug: 'bar' }],
      query: 'foo',
      ResultComponent: SearchResult,
    };
  });

  it('has a nice heading', () => {
    const root = render();
    const heading = findByTag(root, 'h1');
    assert.equal(heading.props.children, 'Add-on Search');
  });

  it('renders the results', () => {
    const root = render();
    const results = findByTag(root, SearchResults);
    assert.strictEqual(results.props.count, props.count);
    assert.strictEqual(results.props.lang, props.lang);
    assert.strictEqual(results.props.results, props.results);
    assert.strictEqual(results.props.query, props.query);
    assert.strictEqual(results.props.loading, props.loading);
    assert.strictEqual(results.props.ResultComponent, props.ResultComponent);
    assert.deepEqual(
      Object.keys(results.props).sort(),
        ['count', 'lang', 'loading', 'results', 'ResultComponent',
         'query'].sort());
  });

  it('renders the query', () => {
    const root = render();
    const form = findByTag(root, SearchForm);
    assert.deepEqual(form.props, {
      pathname: '/en-GB/firefox/search/',
      query: 'foo',
    });
  });

  it('renders a Paginate', () => {
    const root = render();
    const paginator = findByTag(root, Paginate);
    assert.equal(paginator.props.count, 80);
    assert.equal(paginator.props.currentPage, 3);
    assert.equal(paginator.props.pathname, '/en-GB/firefox/search/');
    assert.deepEqual(paginator.props.query, { q: 'foo' });
  });

  it('does not render a Paginate when there is no search term', () => {
    const root = render({ query: null, count: 0, lang: 'en-GB' });
    const paginators = findAllByTag(root, Paginate);
    assert.deepEqual(paginators, []);
  });
});
