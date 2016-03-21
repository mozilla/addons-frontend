import React from 'react';

import SearchPage from 'search/components/SearchPage';
import SearchResults from 'search/components/SearchResults';
import SearchForm from 'search/components/SearchForm';
import { findByTag, shallowRender } from '../../utils';

describe('<SearchPage />', () => {
  let root;
  let state;

  beforeEach(() => {
    state = {
      handleSearch: sinon.spy(),
      loading: false,
      results: [{name: 'Foo', slug: 'foo'}, {name: 'Bar', slug: 'bar'}],
      query: 'foo',
    };
    root = shallowRender(<SearchPage {...state} />);
  });

  it('has a nice heading', () => {
    const heading = findByTag(root, 'h1');
    assert.equal(heading.props.children, 'Add-on Search');
  });

  it('renders the results', () => {
    const results = findByTag(root, SearchResults);
    assert.strictEqual(results.props.results, state.results);
    assert.strictEqual(results.props.query, state.query);
    assert.strictEqual(results.props.loading, state.loading);
    assert.deepEqual(
      Object.keys(results.props).sort(),
      ['loading', 'results', 'query'].sort());
  });

  it('renders the query', () => {
    const form = findByTag(root, SearchForm);
    assert.strictEqual(form.props.onSearch, state.handleSearch);
    assert.deepEqual(Object.keys(form.props), ['onSearch']);
  });
});
