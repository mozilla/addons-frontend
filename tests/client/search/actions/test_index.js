import * as actions from 'search/actions';

describe('SEARCH_STARTED', () => {
  const action = actions.searchStart('foo', 5);

  it('sets the type', () => {
    assert.equal(action.type, 'SEARCH_STARTED');
  });

  it('sets the query', () => {
    assert.deepEqual(action.payload, {query: 'foo', page: 5});
  });
});

describe('SEARCH_LOADED', () => {
  const entities = sinon.stub();
  const result = sinon.stub();
  const action = actions.searchLoad({query: 'foo', entities, result});

  it('sets the type', () => {
    assert.equal(action.type, 'SEARCH_LOADED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, {query: 'foo', entities, result});
  });
});

describe('SEARCH_FAILED', () => {
  const action = actions.searchFail({query: 'foo', page: 25});

  it('sets the type', () => {
    assert.equal(action.type, 'SEARCH_FAILED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, {page: 25, query: 'foo'});
  });
});
