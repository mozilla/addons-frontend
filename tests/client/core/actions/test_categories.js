import * as actions from 'core/actions/categories';

describe('CATEGORIES_GET', () => {
  const params = {
    loading: true,
  };
  const action = actions.categoriesGet(params);

  it('sets the type', () => {
    assert.equal(action.type, 'CATEGORIES_GET');
  });

  it('sets the query', () => {
    assert.deepEqual(action.payload, params);
  });
});

describe('CATEGORIES_LOAD', () => {
  const params = {
    result: { 0: 'foo', 1: 'bar' },
    loading: false,
  };
  const action = actions.categoriesLoad(params);

  it('sets the type', () => {
    assert.equal(action.type, 'CATEGORIES_LOAD');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload.loading, false);
    assert.deepEqual(action.payload.results, ['foo', 'bar']);
  });
});

describe('CATEGORIES_FAILED', () => {
  const params = {
    loading: false,
  };
  const action = actions.categoriesFail(params);

  it('sets the type', () => {
    assert.equal(action.type, 'CATEGORIES_FAILED');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload, params);
  });
});
