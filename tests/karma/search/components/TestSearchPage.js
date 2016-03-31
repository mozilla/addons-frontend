import React from 'react';

import SearchPage from 'search/components/SearchPage';
import SearchResults from 'search/components/SearchResults';
import SearchForm from 'search/components/SearchForm';
import Paginate from 'core/components/Paginate';
import { findAllByTag, findByTag, shallowRender } from '../../../utils';

describe('<SearchPage />', () => {
  let state;

  function render(updateState = {}) {
    return shallowRender(<SearchPage {...Object.assign({}, state, updateState)} />);
  }

  beforeEach(() => {
    state = {
      count: 80,
      page: 3,
      handleSearch: sinon.spy(),
      loading: false,
      results: [{name: 'Foo', slug: 'foo'}, {name: 'Bar', slug: 'bar'}],
      query: 'foo',
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
    assert.strictEqual(results.props.count, state.count);
    assert.strictEqual(results.props.results, state.results);
    assert.strictEqual(results.props.query, state.query);
    assert.strictEqual(results.props.loading, state.loading);
    assert.deepEqual(
      Object.keys(results.props).sort(),
      ['count', 'loading', 'results', 'query'].sort());
  });

  it('renders the query', () => {
    const root = render();
    const form = findByTag(root, SearchForm);
    assert.strictEqual(form.props.onSearch, state.handleSearch);
    assert.deepEqual(Object.keys(form.props), ['onSearch']);
  });

  it('renders a Paginate', () => {
    const root = render();
    const paginator = findByTag(root, Paginate);
    assert.equal(paginator.props.count, 80);
    assert.equal(paginator.props.currentPage, 3);
    assert.equal(typeof paginator.props.pager, 'function');
  });

  it('does not render a Paginate when there is no search term', () => {
    const root = render({query: null, count: 0});
    const paginators = findAllByTag(root, Paginate);
    assert.deepEqual(paginators, []);
  });
});

describe('<SearchPage /> pager()', () => {
  it('calls handleSearch with the query and page', () => {
    const handleSearch = sinon.spy();
    const searchPage = new SearchPage({handleSearch, loading: false, query: 'Howdy'});
    searchPage.pager(20);
    assert(handleSearch.calledWith('Howdy', 20));
  });
});
