import React from 'react';
import { createRenderer } from 'react-addons-test-utils';

import SearchPage from 'search/components/SearchPage';
import SearchResults from 'search/components/SearchResults';
import SearchForm from 'search/components/SearchForm';

function findByTag(root, tag) {
  const matches = root.props.children.filter((child) => child.type === tag);
  assert.equal(matches.length, 1, 'expected one match');
  return matches[0];
}

describe('<SearchPage />', () => {
  let root;
  let state;

  beforeEach(() => {
    state = {
      handleSearch: sinon.spy(),
      results: [{title: 'Foo', slug: 'foo'}, {title: 'Bar', slug: 'bar'}],
      query: 'foo',
    };
    // eslint-disable-next-line new-cap
    const renderer = createRenderer();
    renderer.render(<SearchPage {...state} />);
    root = renderer.getRenderOutput();
  });

  it('has a nice heading', () => {
    const heading = findByTag(root, 'h1');
    assert.equal(heading.props.children, 'Add-on Search');
  });

  it('renders the results', () => {
    const results = findByTag(root, SearchResults);
    assert.strictEqual(results.props.results, state.results);
    assert.strictEqual(results.props.query, state.query);
    assert.deepEqual(
      Object.keys(results.props).sort(),
      ['results', 'query'].sort());
  });

  it('renders the query', () => {
    const form = findByTag(root, SearchForm);
    assert.strictEqual(form.props.onSearch, state.handleSearch);
    assert.deepEqual(Object.keys(form.props), ['onSearch']);
  });
});
