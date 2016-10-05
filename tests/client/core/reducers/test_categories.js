import categories from 'core/reducers/categories';

describe('categories reducer', () => {
  const initialState = { categories: [], error: false, loading: true };

  it('defaults to an empty set of categories', () => {
    const state = categories(undefined, { type: 'unrelated' });
    assert.deepEqual(state.categories, []);
  });

  it('defaults to not loading', () => {
    const { loading } = categories(undefined, { type: 'unrelated' });
    assert.equal(loading, false);
  });

  it('defaults to not error', () => {
    const { error } = categories(undefined, { type: 'unrelated' });
    assert.equal(error, false);
  });

  describe('CATEGORIES_GET', () => {
    it('sets loading', () => {
      const state = categories(initialState,
        { type: 'CATEGORIES_GET', payload: { loading: true } });
      assert.deepEqual(state.categories, []);
      assert.equal(state.error, false);
      assert.equal(state.loading, true);
    });
  });

  describe('CATEGORIES_LOAD', () => {
    const results = ['foo', 'bar'];
    const state = categories(initialState, {
      type: 'CATEGORIES_LOAD',
      payload: { results },
    });

    it('sets the categories', () => {
      assert.deepEqual(state.categories, ['foo', 'bar']);
    });

    it('sets loading', () => {
      const { loading } = state;
      assert.strictEqual(loading, false);
    });

    it('sets no error', () => {
      const { error } = state;
      assert.deepEqual(error, false);
    });
  });

  describe('CATEGORIES_FAILED', () => {
    it('sets error to be true', () => {
      const error = true;
      const loading = false;

      const state = categories(initialState, {
        type: 'CATEGORIES_FAILED', payload: { error, loading } });
      assert.deepEqual(state, { categories: [], error, loading });
    });
  });
});
