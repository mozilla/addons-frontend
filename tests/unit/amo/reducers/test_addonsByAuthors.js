import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import reducer, {
  ADDONS_BY_AUTHORS_PAGE_SIZE,
  fetchAddonsByAuthors,
  getAddonsForSlug,
  getAddonsForUsernames,
  getLoadingForAuthorNames,
  joinAuthorNames,
  initialState,
  loadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon, fakeAuthor } from 'tests/unit/amo/helpers';


describe(__filename, () => {
  function fakeAddons() {
    const firstAddon = {
      ...fakeAddon,
      slug: 'first-addon',
      id: 6,
      authors: [
        { username: 'test', id: 51 },
        { username: 'test2', id: 61 },
      ],
    };
    const secondAddon = {
      ...fakeAddon,
      slug: 'second-addon',
      id: 7,
      authors: [{ username: 'test2', id: 61 }],
    };
    const thirdAddon = {
      ...fakeAddon,
      slug: 'third-addon',
      id: 8,
      authors: [{ username: 'test3', id: 71 }],
    };

    return { firstAddon, secondAddon, thirdAddon };
  }

  describe('reducer', () => {
    it('initializes properly', () => {
      const state = reducer(undefined, {});

      expect(state).toEqual(initialState);
    });

    it('ignores unrelated actions', () => {
      // Load some initial state to be sure that an unrelated action does not
      // change it.
      const state = reducer(undefined, loadAddonsByAuthors({
        addons: [fakeAddon],
        authorNames: [fakeAddon.authors[0].username],
        forAddonSlug: fakeAddon.slug,
      }));
      const newState = reducer(state, { type: 'UNRELATED' });

      expect(newState).toEqual(state);
    });

    it('allows an empty list of add-ons', () => {
      const state = reducer(undefined, loadAddonsByAuthors({
        forAddonSlug: 'addon-slug',
        addons: [],
        authorNames: [fakeAddon.authors[0].username],
      }));

      expect(state.byAddonSlug).toEqual({
        'addon-slug': [],
      });
    });

    it('adds related add-ons by slug', () => {
      const state = reducer(undefined, loadAddonsByAuthors({
        forAddonSlug: 'addon-slug',
        addons: [fakeAddon],
        authorNames: [fakeAddon.authors[0].username],
      }));

      expect(state.byAddonSlug).toEqual({
        'addon-slug': [fakeAddon.id],
      });
    });

    it('always ensures the page size is consistent', () => {
      const forAddonSlug = 'addon-slug';
      const state = reducer(undefined, loadAddonsByAuthors({
        forAddonSlug,
        // This is the case where there are more add-ons loaded than needed.
        addons: Array(ADDONS_BY_AUTHORS_PAGE_SIZE + 2).fill(fakeAddon),
        authorNames: [fakeAddon.authors[0].username],
      }));
      expect(state.byAddonSlug[forAddonSlug])
        .toHaveLength(ADDONS_BY_AUTHORS_PAGE_SIZE);
    });

    it('returns state if no excluded slug is specified', () => {
      const forAddonSlug = 'addon-slug';

      const previousState = reducer(undefined, loadAddonsByAuthors({
        addons: [fakeAddon],
        authorNames: [fakeAddon.authors[0].username],
        forAddonSlug,
      }));

      expect(previousState.byAddonSlug)
        .toEqual({ 'addon-slug': [fakeAddon.id] });

      const state = reducer(previousState, fetchAddonsByAuthors({
        authorNames: ['author2'],
        addonType: ADDON_TYPE_THEME,
        errorHandlerId: 'error-handler-id',
      }));

      expect(state.byAddonSlug).toEqual({ 'addon-slug': [fakeAddon.id] });
    });

    it('resets the loaded add-ons for the slug', () => {
      const forAddonSlug = 'addon-slug';

      const firstState = reducer(undefined, loadAddonsByAuthors({
        addons: [fakeAddon],
        authorNames: [fakeAddon.authors[0].username],
        forAddonSlug,
      }));

      expect(firstState.byAddonSlug).toEqual({ 'addon-slug': [fakeAddon.id] });

      const state = reducer(firstState, fetchAddonsByAuthors({
        authorNames: ['author1'],
        addonType: ADDON_TYPE_THEME,
        errorHandlerId: 'error-handler-id',
        forAddonSlug,
      }));

      expect(state.byAddonSlug).toMatchObject({ 'addon-slug': undefined });
      // It should keep the add-ons by username so they can be added to
      // as is done on the UserProfile page.
      expect(state.byUsername).toMatchObject(firstState.byUsername);
    });

    it('sets the loading state for authorNames + addonType on fetch', () => {
      const state = reducer(undefined, fetchAddonsByAuthors({
        authorNames: ['author1'],
        addonType: ADDON_TYPE_THEME,
        errorHandlerId: 'error-handler-id',
      }));

      expect(state.loadingFor).toMatchObject({
        [joinAuthorNames(['author1'], ADDON_TYPE_THEME)]: true,
      });
    });
  });

  describe('loadAddonsByAuthors()', () => {
    const getParams = (extra = {}) => {
      return {
        addons: [],
        authorNames: ['fakeUsername'],
        forAddonSlug: fakeAddon.slug,
        ...extra,
      };
    };

    it('adds each add-on to each author array', () => {
      const firstAuthor = { ...fakeAuthor, id: 50, username: 'first' };
      const secondAuthor = { ...fakeAuthor, id: 60, username: 'second' };
      const multiAuthorAddon = {
        ...fakeAddon,
        authors: [firstAuthor, secondAuthor],
      };
      const params = getParams({
        addons: [multiAuthorAddon],
        authorNames: [firstAuthor, secondAuthor],
      });

      const newState = reducer(undefined, loadAddonsByAuthors(params));

      expect(newState.byUserId).toEqual({
        [firstAuthor.id]: [multiAuthorAddon.id],
        [secondAuthor.id]: [multiAuthorAddon.id],
      });
    });

    it('adds each different add-on to the byAddonId dictionary', () => {
      const addons = fakeAddons();
      const params = getParams({
        addons: Object.values(addons),
        authorNames: ['fakeUsername'],
        forAddonSlug: undefined,
      });

      const newState = reducer(undefined, loadAddonsByAuthors(params));

      expect(newState.byAddonId).toEqual({
        [addons.firstAddon.id]: createInternalAddon(addons.firstAddon),
        [addons.secondAddon.id]: createInternalAddon(addons.secondAddon),
        [addons.thirdAddon.id]: createInternalAddon(addons.thirdAddon),
      });
    });

    it('adds each different add-on to each author array', () => {
      // See fakeAddons() output, above.
      const firstAuthorId = 51;
      const secondAuthorId = 61;
      const thirdAuthorId = 71;
      const addons = fakeAddons();
      const params = getParams({
        addons: Object.values(addons),
        authorNames: ['test', 'test2', 'test3'],
        forAddonSlug: undefined,
      });

      const newState = reducer(undefined, loadAddonsByAuthors(params));

      expect(newState.byUserId).toEqual({
        [firstAuthorId]: [addons.firstAddon.id],
        [secondAuthorId]: [addons.firstAddon.id, addons.secondAddon.id],
        [thirdAuthorId]: [addons.thirdAddon.id],
      });
    });

    it('does not modify byAddonSlug if forAddonSlug is not set', () => {
      const params = getParams();
      delete params.forAddonSlug;

      const newState = reducer(undefined, loadAddonsByAuthors(params));

      expect(newState.byAddonSlug).toEqual(initialState.byAddonSlug);
    });

    it('modifies byAddonSlug if forAddonSlug is set', () => {
      const params = getParams({
        addons: [fakeAddon],
        forAddonSlug: fakeAddon.slug,
      });

      const newState = reducer(undefined, loadAddonsByAuthors(params));

      expect(newState.byAddonSlug)
        .toEqual({ [fakeAddon.slug]: [fakeAddon.id] });
    });

    it('does not reset the byUsername dictionary when adding add-ons', () => {
      // See fakeAddons() output, above.
      const firstAuthorId = 51;
      const secondAuthorId = 61;
      const thirdAuthorId = 71;
      const addons = fakeAddons();

      const firstParams = getParams({
        addons: [addons.firstAddon, addons.secondAddon],
        forAddonSlug: undefined,
      });
      let state = reducer(undefined, loadAddonsByAuthors(firstParams));

      const secondParams = getParams({
        addons: [addons.thirdAddon],
        forAddonSlug: undefined,
      });
      state = reducer(state, loadAddonsByAuthors(secondParams));

      expect(state.byUserId).toEqual({
        [firstAuthorId]: [addons.firstAddon.id],
        [secondAuthorId]: [addons.firstAddon.id, addons.secondAddon.id],
        [thirdAuthorId]: [addons.thirdAddon.id],
      });
    });

    it('sets the loading state for authorNames once loaded', () => {
      let state = reducer(undefined, fetchAddonsByAuthors({
        authorNames: ['author1'],
        errorHandlerId: 'error-handler-id',
      }));

      state = reducer(state, loadAddonsByAuthors({
        addons: [fakeAddon],
        authorNames: ['author1'],
      }));

      expect(state.loadingFor).toMatchObject({
        [joinAuthorNames(['author1'])]: false,
      });
    });

    it('sets the loading state for authorNames + addonType once loaded', () => {
      let state = reducer(undefined, fetchAddonsByAuthors({
        authorNames: ['author1'],
        addonType: ADDON_TYPE_THEME,
        errorHandlerId: 'error-handler-id',
      }));

      state = reducer(state, loadAddonsByAuthors({
        addons: [fakeAddon],
        addonType: ADDON_TYPE_THEME,
        authorNames: ['author1'],
      }));

      expect(state.loadingFor).toMatchObject({
        [joinAuthorNames(['author1'], ADDON_TYPE_THEME)]: false,
      });
    });
  });

  describe('getAddonsForSlug', () => {
    it('returns addons', () => {
      const addons = fakeAddons();
      const state = reducer(undefined, loadAddonsByAuthors({
        addons: Object.values(addons),
        authorNames: ['fakeUsername'],
        forAddonSlug: 'test',
      }));

      expect(getAddonsForSlug(state, 'test')).toEqual([
        createInternalAddon(addons.firstAddon),
        createInternalAddon(addons.secondAddon),
        createInternalAddon(addons.thirdAddon),
      ]);
    });

    it('returns nothing if no add-ons are found', () => {
      const addons = fakeAddons();
      const state = reducer(undefined, loadAddonsByAuthors({
        addons: Object.values(addons),
        authorNames: ['fakeUsername'],
        forAddonSlug: 'test',
      }));

      expect(getAddonsForSlug(state, 'not-a-slug')).toBeNull();
    });
  });

  describe('getAddonsForUsernames selector', () => {
    it('returns addons for a single author', () => {
      const addons = fakeAddons();
      const state = reducer(undefined, loadAddonsByAuthors({
        addons: Object.values(addons),
        authorNames: ['fakeUsername'],
      }));

      expect(getAddonsForUsernames(state, ['test2'])).toEqual([
        createInternalAddon(addons.firstAddon),
        createInternalAddon(addons.secondAddon),
      ]);
    });

    it('returns addons for multiple authors of different add-ons', () => {
      const addons = fakeAddons();
      const state = reducer(undefined, loadAddonsByAuthors({
        addons: Object.values(addons),
        authorNames: ['fakeUsername'],
      }));

      expect(getAddonsForUsernames(state, ['test', 'test3'])).toEqual([
        createInternalAddon(addons.firstAddon),
        createInternalAddon(addons.thirdAddon),
      ]);
    });

    it('returns addons for multiple authors that share add-ons', () => {
      const addons = fakeAddons();
      const state = reducer(undefined, loadAddonsByAuthors({
        addons: Object.values(addons),
        authorNames: ['test', 'test2'],
      }));

      expect(getAddonsForUsernames(state, ['test', 'test2'])).toEqual([
        createInternalAddon(addons.firstAddon),
        createInternalAddon(addons.secondAddon),
      ]);
    });

    it('omits addon with matching slug', () => {
      // Usually the `fetchAddonsByAuthors` action includes a `forAddonSlug`
      // that is passed to the API as the `exclude_addons` property, meaning
      // the same add-on won't appear in the search results of a user's
      // other add-ons for one request, but after several requests are made
      // we end up looking through the entire reducer, so we have this filter
      // to prevent an add-on from appearing in its own "by this author"
      // list.
      const addons = fakeAddons();
      const authorNames = ['test', 'test2', 'test3'];
      const state = reducer(undefined, loadAddonsByAuthors({
        addons: Object.values(addons),
        addonType: ADDON_TYPE_EXTENSION,
        authorNames,
      }));

      expect(getAddonsForUsernames(
        state, authorNames, ADDON_TYPE_EXTENSION, addons.firstAddon.slug
      )).toEqual([
        createInternalAddon(addons.secondAddon),
        createInternalAddon(addons.thirdAddon),
      ]);
    });

    it('returns nothing if no add-ons are found', () => {
      const addons = fakeAddons();
      const state = reducer(undefined, loadAddonsByAuthors({
        addons: Object.values(addons),
        authorNames: ['fakeUsername'],
      }));

      expect(getAddonsForUsernames(state, ['nobody'])).toBeNull();
    });
  });

  describe('getLoadingForAuthorNames', () => {
    it('returns loading for just authorNames', () => {
      const state = reducer(undefined, fetchAddonsByAuthors({
        authorNames: ['author1'],
        errorHandlerId: 'error-handler-id',
      }));

      expect(getLoadingForAuthorNames(state, ['author1'])).toEqual(true);
    });

    it('returns loading for authorNames + addonType', () => {
      const state = reducer(undefined, fetchAddonsByAuthors({
        authorNames: ['author1'],
        addonType: ADDON_TYPE_THEME,
        errorHandlerId: 'error-handler-id',
      }));

      expect(getLoadingForAuthorNames(state, ['author1'], ADDON_TYPE_THEME))
        .toEqual(true);
    });

    it('returns null when there is no match', () => {
      const state = reducer(undefined, fetchAddonsByAuthors({
        authorNames: ['author1'],
        errorHandlerId: 'error-handler-id',
      }));

      expect(getLoadingForAuthorNames(state, ['author2'])).toEqual(null);
    });

    it('returns null when no authorNames provided', () => {
      const state = reducer(undefined, fetchAddonsByAuthors({
        authorNames: ['author1'],
        errorHandlerId: 'error-handler-id',
      }));

      expect(getLoadingForAuthorNames(state, [])).toEqual(null);
      expect(getLoadingForAuthorNames(state, null)).toEqual(null);
    });
  });

  describe('joinAuthorNames', () => {
    it('returns authorNames', () => {
      expect(joinAuthorNames(['author1', 'author2']))
        .toEqual('author1-author2');
    });

    it('returns authorNames + addonType', () => {
      expect(joinAuthorNames(['author1', 'author2'], ADDON_TYPE_THEME))
        .toEqual(`author1-author2-${ADDON_TYPE_THEME}`);
    });

    it('handles a single authorName', () => {
      expect(joinAuthorNames(['author1'], ADDON_TYPE_THEME))
        .toEqual(`author1-${ADDON_TYPE_THEME}`);
    });
  });
});
