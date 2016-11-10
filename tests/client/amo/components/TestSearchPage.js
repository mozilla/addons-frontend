import React from 'react';

import SearchPage from 'amo/components/SearchPage';
import CategoryInfo from 'amo/components/CategoryInfo';
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
      CategoryInfoComponent: CategoryInfo,
      ResultComponent: SearchResult,
      addonType: 'extension',
      category: null,
      count: 80,
      page: 3,
      handleSearch: sinon.spy(),
      hasSearchParams: true,
      loading: false,
      results: [{ name: 'Foo', slug: 'foo' }, { name: 'Bar', slug: 'bar' }],
      query: 'foo',
    };
  });

  it('renders the results', () => {
    const root = render();
    const results = findByTag(root, SearchResults);
    assert.strictEqual(results.props.CategoryInfoComponent,
      props.CategoryInfoComponent);
    assert.strictEqual(results.props.ResultComponent, props.ResultComponent);
    assert.strictEqual(results.props.addonType, props.addonType);
    assert.strictEqual(results.props.category, props.category);
    assert.strictEqual(results.props.count, props.count);
    assert.strictEqual(results.props.hasSearchParams, props.hasSearchParams);
    assert.strictEqual(results.props.loading, props.loading);
    assert.strictEqual(results.props.results, props.results);
    assert.strictEqual(results.props.query, props.query);
    assert.deepEqual(
      Object.keys(results.props).sort(), [
        'CategoryInfoComponent', 'ResultComponent', 'addonType', 'category',
        'count', 'hasSearchParams', 'loading', 'results', 'query'].sort()
      );
  });

  it('renders a Paginate', () => {
    const root = render();
    const paginator = findByTag(root, Paginate);
    assert.equal(paginator.props.count, 80);
    assert.equal(paginator.props.currentPage, 3);
    assert.equal(paginator.props.pathname, '/search/');
    assert.deepEqual(paginator.props.query, { q: 'foo' });
  });

  it('does not render a Paginate when there is no search term', () => {
    const root = render({ query: undefined, count: 0 });
    const paginators = findAllByTag(root, Paginate);
    assert.deepEqual(paginators, []);
  });
});
