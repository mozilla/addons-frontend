import * as actions from 'core/actions/categories';


describe('CATEGORIES_FETCH', () => {
  const action = actions.categoriesFetch();

  it('sets the type', () => {
    assert.equal(action.type, 'CATEGORIES_FETCH');
  });
});

describe('CATEGORIES_LOAD', () => {
  const response = {
    entities: {},
    result: ['foo', 'bar'],
  };
  const action = actions.categoriesLoad(response);

  it('sets the type', () => {
    assert.equal(action.type, 'CATEGORIES_LOAD');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload.result, ['foo', 'bar']);
  });
});

describe('CATEGORIES_FAIL', () => {
  const error = new Error('I am an error');
  const action = actions.categoriesFail(error);

  it('sets the type', () => {
    assert.equal(action.type, 'CATEGORIES_FAIL');
  });

  it('sets the payload', () => {
    assert.deepEqual(action.payload.error, error);
  });
});
