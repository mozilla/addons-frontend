import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
} from 'amo/constants';
import categories, {
  FETCH_CATEGORIES,
  fetchCategories,
  loadCategories,
  initialState,
} from 'amo/reducers/categories';
import { fakeCategory } from 'tests/unit/helpers';

describe(__filename, () => {
  it('defaults to an empty set of categories', () => {
    const state = categories(undefined, { type: 'unrelated' });
    expect(state.categories).toEqual(null);
  });

  it('defaults to not loading', () => {
    const { loading } = categories(undefined, { type: 'unrelated' });
    expect(loading).toEqual(false);
  });

  describe('LOAD_CATEGORIES', () => {
    let state;

    beforeEach(() => {
      const results = [
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
          type: ADDON_TYPE_STATIC_THEME,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_FIREFOX,
          name: 'Painting',
          slug: 'painting',
          type: ADDON_TYPE_STATIC_THEME,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_FIREFOX,
          name: 'Anime',
          slug: 'anime',
          type: ADDON_TYPE_STATIC_THEME,
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
          application: CLIENT_APP_FIREFOX,
          name: 'I should also not appear',
          slug: 'i-should-also-not-appear',
          type: 'FAKE_TYPE',
        },
        {},
      ];

      state = categories(initialState, loadCategories({ results }));
    });

    it('sets the categories in a sorted order', () => {
      const results = [
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
          type: ADDON_TYPE_STATIC_THEME,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_FIREFOX,
          name: 'Naturé',
          slug: 'naturé',
          type: ADDON_TYPE_STATIC_THEME,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_FIREFOX,
          name: 'Painting',
          slug: 'painting',
          type: ADDON_TYPE_STATIC_THEME,
        },
        {
          ...fakeCategory,
          application: CLIENT_APP_ANDROID,
          name: 'Painting',
          slug: 'painting',
          type: ADDON_TYPE_STATIC_THEME,
        },
      ];
      state = categories(initialState, loadCategories({ results }));

      expect(state.categories).toEqual({
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
        [ADDON_TYPE_STATIC_THEME]: {
          anime: {
            ...fakeCategory,
            application: CLIENT_APP_FIREFOX,
            name: 'Anime',
            slug: 'anime',
            type: ADDON_TYPE_STATIC_THEME,
          },
          naturé: {
            ...fakeCategory,
            application: CLIENT_APP_FIREFOX,
            name: 'Naturé',
            slug: 'naturé',
            type: ADDON_TYPE_STATIC_THEME,
          },
          painting: {
            ...fakeCategory,
            application: CLIENT_APP_FIREFOX,
            name: 'Painting',
            slug: 'painting',
            type: ADDON_TYPE_STATIC_THEME,
          },
        },
      });
    });

    it('sets loading', () => {
      const { loading } = state;
      expect(loading).toEqual(false);
    });
  });

  describe('FETCH_CATEGORIES', () => {
    function _fetchCategories({ errorHandlerId = 'some-handler-id' } = {}) {
      return fetchCategories({ errorHandlerId });
    }

    it('sets the type', () => {
      expect(_fetchCategories().type).toEqual(FETCH_CATEGORIES);
    });

    it('puts the error handler ID in the payload', () => {
      const errorHandlerId = 'some-custom-id';
      expect(
        _fetchCategories({ errorHandlerId }).payload.errorHandlerId,
      ).toEqual(errorHandlerId);
    });

    it('sets loading', () => {
      const state = categories(
        initialState,
        fetchCategories({ errorHandlerId: 'some-handler' }),
      );
      expect(state.loading).toEqual(true);
    });
  });
});
