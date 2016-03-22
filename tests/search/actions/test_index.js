import * as actions from 'search/actions';

describe('SEARCH_STARTED', () => {
  const action = actions.searchStart('foo');

  it('sets the type', () => {
    assert.equal(action.type, 'SEARCH_STARTED');
  });

  it('sets the query', () => {
    assert.deepEqual(action.payload, {query: 'foo'});
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

describe('ENTITIES_LOADED', () => {
  const entities = sinon.stub();
  const action = actions.loadEntities(entities);

  it('sets the type', () => {
    assert.equal(action.type, 'ENTITIES_LOADED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, {entities});
  });
});
