import {
  ADDON_TYPE_COMPLETE_THEME,
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
} from 'core/constants';
import { categoriesFetch, categoriesLoad } from 'core/actions/categories';
import categories, { initialState } from 'core/reducers/categories';
import { fakeCategory } from 'tests/unit/amo/helpers';


describe('categories reducer', () => {
  it('defaults to an empty set of categories', () => {
    const state = categories(undefined, { type: 'unrelated' });
    expect(state.categories).toEqual(null);
  });

  it('defaults to not loading', () => {
    const { loading } = categories(undefined, { type: 'unrelated' });
    expect(loading).toEqual(false);
  });

  describe('CATEGORIES_FETCH', () => {
    it('sets loading', () => {
      const state = categories(initialState,
        categoriesFetch({ errorHandlerId: 'some-handler' }));
      expect(state.categories).toEqual(null);
      expect(state.loading).toEqual(true);
    });
  });

  describe('CATEGORIES_LOAD', () => {
    let state;

    beforeAll(() => {
      const result = [
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          name: 'Alerts & Update',
          slug: 'alert-update',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          name: 'Games',
          slug: 'Games',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          name: 'Blogging',
          slug: 'blogging',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_FIREFOX,
          name: 'Naturé',
          slug: 'naturé',
          type: ADDON_TYPE_THEME,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_FIREFOX,
          name: 'Painting',
          slug: 'painting',
          type: ADDON_TYPE_THEME,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_FIREFOX,
          name: 'Anime',
          slug: 'anime',
          type: ADDON_TYPE_THEME,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_FIREFOX,
          name: 'Alerts & Update',
          slug: 'alert-update',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_FIREFOX,
          name: 'Security',
          slug: 'security',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          ...fakeCategory,
          application: 'netscape',
          name: 'I should not appear',
          slug: 'i-should-not-appear',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          name: 'I should also not appear',
          slug: 'i-should-also-not-appear',
          type: 'FAKE_TYPE',
        },
      ];
      state = categories(initialState, categoriesLoad({ result }));
    });

    it('sets the categories in a sorted order', () => {
      const result = [
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          name: 'Alerts & Update',
          slug: 'alert-update',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          name: 'Blogging',
          slug: 'blogging',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          name: 'Games',
          slug: 'Games',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_FIREFOX,
          name: 'Alerts & Update',
          slug: 'alert-update',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_FIREFOX,
          name: 'Security',
          slug: 'security',
          type: ADDON_TYPE_EXTENSION,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_FIREFOX,
          name: 'Anime',
          slug: 'anime',
          type: ADDON_TYPE_THEME,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_FIREFOX,
          name: 'Naturé',
          slug: 'naturé',
          type: ADDON_TYPE_THEME,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_FIREFOX,
          name: 'Painting',
          slug: 'painting',
          type: ADDON_TYPE_THEME,
        },
      ];
      state = categories(initialState, categoriesLoad({ result }));

      // Notice all Firefox theme categories are also set as Android theme
      // categories and no Android categories are returned. This reflects the
      // current state of AMO.
      // See: https://github.com/mozilla/addons-frontend/issues/2170
      //
      // This can be changed once
      // https://github.com/mozilla/addons-server/issues/4766 is fixed.
      expect(state.categories).toEqual({
        firefox: {
          [ADDON_TYPE_COMPLETE_THEME]: {},
          [ADDON_TYPE_DICT]: {},
          [ADDON_TYPE_EXTENSION]: {
            'alert-update': {
              ...fakeCategory,
              application: CLIENT_APP_FIREFOX,
              name: 'Alerts & Update',
              slug: 'alert-update',
              type: ADDON_TYPE_EXTENSION,
            },
            security: {
              ...fakeCategory,
              application: CLIENT_APP_FIREFOX,
              name: 'Security',
              slug: 'security',
              type: ADDON_TYPE_EXTENSION,
            },
          },
          [ADDON_TYPE_LANG]: {},
          [ADDON_TYPE_OPENSEARCH]: {},
          [ADDON_TYPE_STATIC_THEME]: {},
          [ADDON_TYPE_THEME]: {
            anime: {
              ...fakeCategory,
              application: CLIENT_APP_FIREFOX,
              name: 'Anime',
              slug: 'anime',
              type: ADDON_TYPE_THEME,
            },
            naturé: {
              ...fakeCategory,
              application: CLIENT_APP_FIREFOX,
              name: 'Naturé',
              slug: 'naturé',
              type: ADDON_TYPE_THEME,
            },
            painting: {
              ...fakeCategory,
              application: CLIENT_APP_FIREFOX,
              name: 'Painting',
              slug: 'painting',
              type: ADDON_TYPE_THEME,
            },
          },
        },
        android: {
          [ADDON_TYPE_COMPLETE_THEME]: {},
          [ADDON_TYPE_DICT]: {},
          [ADDON_TYPE_EXTENSION]: {
            'alert-update': {
              ...fakeCategory,
              application: CLIENT_APP_ANDROID,
              name: 'Alerts & Update',
              slug: 'alert-update',
              type: ADDON_TYPE_EXTENSION,
            },
            blogging: {
              ...fakeCategory,
              application: CLIENT_APP_ANDROID,
              name: 'Blogging',
              slug: 'blogging',
              type: ADDON_TYPE_EXTENSION,
            },
            Games: {
              ...fakeCategory,
              application: CLIENT_APP_ANDROID,
              name: 'Games',
              slug: 'Games',
              type: ADDON_TYPE_EXTENSION,
            },
          },
          [ADDON_TYPE_LANG]: {},
          [ADDON_TYPE_OPENSEARCH]: {},
          [ADDON_TYPE_STATIC_THEME]: {},
          [ADDON_TYPE_THEME]: {
            anime: {
              ...fakeCategory,
              application: CLIENT_APP_FIREFOX,
              name: 'Anime',
              slug: 'anime',
              type: ADDON_TYPE_THEME,
            },
            naturé: {
              ...fakeCategory,
              application: CLIENT_APP_FIREFOX,
              name: 'Naturé',
              slug: 'naturé',
              type: ADDON_TYPE_THEME,
            },
            painting: {
              ...fakeCategory,
              application: CLIENT_APP_FIREFOX,
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
      expect(loading).toBe(false);
    });
  });
});
