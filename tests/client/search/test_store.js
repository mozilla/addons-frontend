import createStore from 'search/store';

describe('search createStore', () => {
  it('sets the reducers', () => {
    const store = createStore();
    assert.deepEqual(
      Object.keys(store.getState()).sort(),
      ['addons', 'api', 'auth', 'reduxAsyncConnect', 'search']);
  });

  it('creates an empty store', () => {
    const store = createStore();
    assert.deepEqual(store.getState().addons, {});
  });

  it('creates a store with an initial state', () => {
    const store = createStore({addons: {foo: {slug: 'foo'}}});
    assert.deepEqual(store.getState().addons, {foo: {slug: 'foo'}});
  });
});
