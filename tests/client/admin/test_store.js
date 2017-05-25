import createStore from 'admin/store';

describe('search createStore', () => {
  it('sets the reducers', () => {
    const { store } = createStore();
    expect(Object.keys(store.getState()).sort())
      .toEqual(['addons', 'api', 'auth', 'reduxAsyncConnect', 'search', 'users']);
  });

  it('creates an empty store', () => {
    const { store } = createStore();
    expect(store.getState().addons).toEqual({});
  });

  it('creates a store with an initial state', () => {
    const { store } = createStore({ addons: { foo: { slug: 'foo' } } });
    expect(store.getState().addons).toEqual({ foo: { slug: 'foo' } });
  });
});
