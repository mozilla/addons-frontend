import * as actions from 'admin/actions';

describe('ADMIN_SEARCH_STARTED', () => {
  const action = actions.adminSearchStart('foo', 5);

  it('sets the type', () => {
    assert.equal(action.type, 'ADMIN_SEARCH_STARTED');
  });

  it('sets the query', () => {
    assert.deepEqual(action.payload, { query: 'foo', page: 5 });
  });
});

describe('ADMIN_SEARCH_LOADED', () => {
  const entities = sinon.stub();
  const result = sinon.stub();
  const action = actions.adminSearchLoad({ query: 'foo', entities, result });

  it('sets the type', () => {
    assert.equal(action.type, 'ADMIN_SEARCH_LOADED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, { query: 'foo', entities, result });
  });
});

describe('ADMIN_SEARCH_FAILED', () => {
  const action = actions.adminSearchFail({ query: 'foo', page: 25 });

  it('sets the type', () => {
    assert.equal(action.type, 'ADMIN_SEARCH_FAILED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, { page: 25, query: 'foo' });
  });
});
