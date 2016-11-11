import * as actions from 'core/actions/search';

describe('SEARCH_STARTED', () => {
  const action = actions.searchStart({ filters: { query: 'foo' }, page: 5 });

  it('sets the type', () => {
    assert.equal(action.type, 'SEARCH_STARTED');
  });

  it('sets the query', () => {
    assert.deepEqual(action.payload, { filters: { query: 'foo' }, page: 5 });
  });
});

describe('SEARCH_LOADED', () => {
  const entities = sinon.stub();
  const result = sinon.stub();
  const action = actions.searchLoad({ filters: { query: 'foø' }, entities, result });

  it('sets the type', () => {
    assert.equal(action.type, 'SEARCH_LOADED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, { filters: { query: 'foø' }, entities, result });
  });
});

describe('SEARCH_FAILED', () => {
  const action = actions.searchFail({ filters: { query: 'foo' }, page: 25 });

  it('sets the type', () => {
    assert.equal(action.type, 'SEARCH_FAILED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, { page: 25, filters: { query: 'foo' } });
  });
});
