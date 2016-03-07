import search, { getMatchingAddons } from 'search/reducers/search';

describe('search reducer', () => {
  it('defaults to a null query', () => {
    const { query } = search(undefined, {type: 'unrelated'});
    assert.strictEqual(query, null);
  });

  it('sets the query on SET_QUERY', () => {
    const state = search(undefined, {type: 'SET_QUERY', query: 'foo'});
    assert.equal(state.query, 'foo');
    const newState = search(state, {type: 'SET_QUERY', query: 'bar'});
    assert.equal(newState.query, 'bar');
  });
});

describe('getMatchingAddons', () => {
  it('matches on the title', () => {
    assert.deepEqual(
      getMatchingAddons(
        [{title: 'Foo'}, {title: 'Bar'}, {title: 'Bar Food'}],
        'Foo'),
      [{title: 'Foo'}, {title: 'Bar Food'}]);
  });
});
