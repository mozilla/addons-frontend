import createStore from 'amo/store';
import { initialState } from 'core/reducers/addons';

describe(__filename, () => {
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
      'languageTools',
      'redirectTo',
      'reviews',
      'routing',
      'search',
      'user',
      'users',
      'viewContext',
    ]);
  });

  it('creates an empty store', () => {
    const { store } = createStore();
    expect(store.getState().addons).toEqual(initialState);
  });
});
