import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_THEME,
} from 'core/constants';
import { categoriesFetch } from 'core/actions/categories';
import categories, { emptyCategoryList } from 'core/reducers/categories';


describe('categories reducer', () => {
  const initialState = {
    categories: emptyCategoryList(), error: false, loading: true,
  };

  it('defaults to an empty set of categories', () => {
    const state = categories(initialState, { type: 'unrelated' });
    assert.deepEqual(state.categories, emptyCategoryList());
  });

  it('defaults to not loading', () => {
    const { loading } = categories(undefined, { type: 'unrelated' });
    assert.equal(loading, false);
  });

  it('defaults to not error', () => {
    const { error } = categories(undefined, { type: 'unrelated' });
    assert.equal(error, false);
  });

  describe('CATEGORIES_FETCH', () => {
    it('sets loading', () => {
      const state = categories(initialState, categoriesFetch());
      assert.deepEqual(state.categories, emptyCategoryList());
      assert.equal(state.error, false);
      assert.equal(state.loading, true);
    });
  });

  describe('CATEGORIES_LOAD', () => {
    let state;

    before(() => {
      const result = [
        {
          application: 'android',
          name: 'Alerts & Update',
          slug: 'alert-update',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'android',
          name: 'Games',
          slug: 'Games',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'android',
          name: 'Blogging',
          slug: 'blogging',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'firefox',
          name: 'Naturé',
          slug: 'naturé',
          type: ADDON_TYPE_THEME,
        },
        {
          application: 'firefox',
          name: 'Painting',
          slug: 'painting',
          type: ADDON_TYPE_THEME,
        },
        {
          application: 'firefox',
          name: 'Anime',
          slug: 'anime',
          type: ADDON_TYPE_THEME,
        },
        {
          application: 'firefox',
          name: 'Alerts & Update',
          slug: 'alert-update',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'firefox',
          name: 'Security',
          slug: 'security',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'netscape',
          name: 'I should not appear',
          slug: 'i-should-not-appear',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'android',
          name: 'I should also not appear',
          slug: 'i-should-also-not-appear',
          type: 'FAKE_TYPE',
        },
      ];
      state = categories(initialState, {
        type: 'CATEGORIES_LOAD',
        payload: { result },
      });
    });

    it('sets the categories', () => {
      const result = [
        {
          application: 'android',
          name: 'Alerts & Update',
          slug: 'alert-update',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'android',
          name: 'Blogging',
          slug: 'blogging',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'android',
          name: 'Games',
          slug: 'Games',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'firefox',
          name: 'Alerts & Update',
          slug: 'alert-update',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'firefox',
          name: 'Security',
          slug: 'security',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          application: 'firefox',
          name: 'Anime',
          slug: 'anime',
          type: ADDON_TYPE_THEME,
        },
        {
          application: 'firefox',
          name: 'Naturé',
          slug: 'naturé',
          type: ADDON_TYPE_THEME,
        },
        {
          application: 'firefox',
          name: 'Painting',
          slug: 'painting',
          type: ADDON_TYPE_THEME,
        },
      ];
      state = categories(initialState, {
        type: 'CATEGORIES_LOAD',
        payload: { result },
      });

      // Notice all Firefox theme categories are also set as Android theme
      // categories and no Android categories are returned. This reflects the
      // current state of AMO.
      // See: https://github.com/mozilla/addons-frontend/issues/2170
      //
      // This can be changed once
      // https://github.com/mozilla/addons-server/issues/4766 is fixed.
      assert.deepEqual(state.categories, {
        firefox: {
          [ADDON_TYPE_DICT]: {},
          [ADDON_TYPE_EXTENSION]: {
            'alert-update': {
              application: 'firefox',
              name: 'Alerts & Update',
              slug: 'alert-update',
              type: ADDON_TYPE_EXTENSION,
            },
            security: {
              application: 'firefox',
              name: 'Security',
              slug: 'security',
              type: ADDON_TYPE_EXTENSION,
            },
          },
          [ADDON_TYPE_LANG]: {},
          [ADDON_TYPE_OPENSEARCH]: {},
          [ADDON_TYPE_THEME]: {
            anime: {
              application: 'firefox',
              name: 'Anime',
              slug: 'anime',
              type: ADDON_TYPE_THEME,
            },
            naturé: {
              application: 'firefox',
              name: 'Naturé',
              slug: 'naturé',
              type: ADDON_TYPE_THEME,
            },
            painting: {
              application: 'firefox',
              name: 'Painting',
              slug: 'painting',
              type: ADDON_TYPE_THEME,
            },
          },
        },
        android: {
          [ADDON_TYPE_DICT]: {},
          [ADDON_TYPE_EXTENSION]: {
            'alert-update': {
              application: 'android',
              name: 'Alerts & Update',
              slug: 'alert-update',
              type: ADDON_TYPE_EXTENSION,
            },
            blogging: {
              application: 'android',
              name: 'Blogging',
              slug: 'blogging',
              type: ADDON_TYPE_EXTENSION,
            },
            Games: {
              application: 'android',
              name: 'Games',
              slug: 'Games',
              type: ADDON_TYPE_EXTENSION,
            },
          },
          [ADDON_TYPE_LANG]: {},
          [ADDON_TYPE_OPENSEARCH]: {},
          [ADDON_TYPE_THEME]: {
            anime: {
              application: 'firefox',
              name: 'Anime',
              slug: 'anime',
              type: ADDON_TYPE_THEME,
            },
            naturé: {
              application: 'firefox',
              name: 'Naturé',
              slug: 'naturé',
              type: ADDON_TYPE_THEME,
            },
            painting: {
              application: 'firefox',
              name: 'Painting',
              slug: 'painting',
              type: ADDON_TYPE_THEME,
            },
          },
        },
      });
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

  describe('CATEGORIES_FAIL', () => {
    it('sets error to be true', () => {
      const error = true;
      const loading = false;

      const state = categories(initialState, {
        type: 'CATEGORIES_FAIL', payload: { error, loading },
      });
      assert.deepEqual(state, {
        categories: emptyCategoryList(), error, loading,
      });
    });
  });
});
