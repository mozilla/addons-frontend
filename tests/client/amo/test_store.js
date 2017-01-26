import createStore from 'amo/store';

describe('amo createStore', () => {
  it('sets the reducers', () => {
    const store = createStore();
    assert.deepEqual(
      Object.keys(store.getState()).sort(),
      [
        'addons',
        'api',
        'auth',
        'categories',
        'errors',
        'featured',
        'infoDialog',
        'installations',
        'landing',
        'reduxAsyncConnect',
        'reviews',
        'search',
      ]
    );
  });

  it('creates an empty store', () => {
    const store = createStore();
    assert.deepEqual(store.getState().addons, {});
  });
});
