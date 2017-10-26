import createStore from 'amo/store';

describe('amo createStore', () => {
  it('sets the reducers', () => {
    const { store } = createStore();
    expect(Object.keys(store.getState()).sort()).toEqual([
      'abuse',
      'addons',
      'addonsByAuthors',
      'api',
      'autocomplete',
      'categories',
      'collections',
      'errorPage',
      'errors',
      'heroBanners',
      'home',
      'infoDialog',
      'installations',
      'landing',
      'redirectTo',
      'reduxAsyncConnect',
      'reviews',
      'search',
      'user',
      'viewContext',
    ]);
  });

  it('creates an empty store', () => {
    const { store } = createStore();
    expect(store.getState().addons).toEqual({});
  });
});
