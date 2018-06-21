import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
} from 'core/constants';
import reducer, {
  EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
  THEMES_BY_AUTHORS_PAGE_SIZE,
  fetchAddonsByAuthors,
  getAddonsForSlug,
  getAddonsForUsernames,
  getCountForAuthorNames,
  getLoadingForAuthorNames,
  initialState,
  joinAuthorNamesAndAddonType,
  loadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon, fakeAuthor, fakeTheme } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const fakeAuthorOne = { ...fakeAuthor, username: 'test', id: 51 };
  const fakeAuthorTwo = { ...fakeAuthor, username: 'test2', id: 61 };
  const fakeAuthorThree = { ...fakeAuthor, username: 'test3', id: 71 };

  function fakeAddons({ type = ADDON_TYPE_EXTENSION } = {}) {
    const firstAddon = {
      ...fakeAddon,
      type,
      slug: 'first-addon',
      id: 6,
      authors: [fakeAuthorOne, fakeAuthorTwo],
    };
    const secondAddon = {
      ...fakeAddon,
      type,
      slug: 'second-addon',
      id: 7,
      authors: [fakeAuthorTwo],
    };
    const thirdAddon = {
      ...fakeAddon,
      slug: 'third-addon',
      id: 8,
      authors: [fakeAuthorThree],
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
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: [fakeAddon],
          authorUsernames: [fakeAddon.authors[0].username],
          count: 1,
          forAddonSlug: fakeAddon.slug,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );
      const newState = reducer(state, { type: 'UNRELATED' });

      expect(newState).toEqual(state);
    });

    it('allows an empty list of add-ons', () => {
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: [],
          authorUsernames: [fakeAddon.authors[0].username],
          count: 0,
          forAddonSlug: 'addon-slug',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.byAddonSlug).toEqual({
        'addon-slug': [],
      });
    });

    it('adds related add-ons by slug', () => {
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: [fakeAddon],
          authorUsernames: [fakeAddon.authors[0].username],
          count: 1,
          forAddonSlug: 'addon-slug',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.byAddonSlug).toEqual({
        'addon-slug': [fakeAddon.id],
      });
    });

    it("always ensures extensions' page size is consistent", () => {
      const forAddonSlug = 'addon-slug';
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          forAddonSlug,
          // This is the case where there are more add-ons loaded than needed.
          addons: Array(EXTENSIONS_BY_AUTHORS_PAGE_SIZE + 2).fill(fakeAddon),
          authorUsernames: [fakeAddon.authors[0].username],
          count: EXTENSIONS_BY_AUTHORS_PAGE_SIZE + 2,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.byAddonSlug[forAddonSlug]).toHaveLength(
        EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
      );
    });

    it("always ensures themes' page size is consistent", () => {
      const forAddonSlug = 'addon-slug';
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          forAddonSlug,
          // This is the case where there are more add-ons loaded than needed.
          addons: Array(THEMES_BY_AUTHORS_PAGE_SIZE + 2).fill(fakeAddon),
          authorUsernames: [fakeAddon.authors[0].username],
          addonType: ADDON_TYPE_THEME,
          count: THEMES_BY_AUTHORS_PAGE_SIZE + 2,
          pageSize: THEMES_BY_AUTHORS_PAGE_SIZE,
        }),
      );
      expect(state.byAddonSlug[forAddonSlug]).toHaveLength(
        THEMES_BY_AUTHORS_PAGE_SIZE,
      );
    });

    it('returns state if no excluded slug is specified', () => {
      const forAddonSlug = 'addon-slug';

      const previousState = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: [fakeAddon],
          authorUsernames: [fakeAddon.authors[0].username],
          count: 1,
          forAddonSlug,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(previousState.byAddonSlug).toEqual({
        'addon-slug': [fakeAddon.id],
      });

      const state = reducer(
        previousState,
        fetchAddonsByAuthors({
          authorUsernames: ['author2'],
          addonType: ADDON_TYPE_THEME,
          errorHandlerId: 'error-handler-id',
          pageSize: THEMES_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.byAddonSlug).toEqual({ 'addon-slug': [fakeAddon.id] });
    });

    it('resets the loaded add-ons for the slug', () => {
      const forAddonSlug = 'addon-slug';

      const firstState = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: [fakeAddon],
          authorUsernames: [fakeAddon.authors[0].username],
          count: 1,
          forAddonSlug,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(firstState.byAddonSlug).toEqual({ 'addon-slug': [fakeAddon.id] });

      const state = reducer(
        firstState,
        fetchAddonsByAuthors({
          addonType: ADDON_TYPE_THEME,
          authorUsernames: ['author1'],
          errorHandlerId: 'error-handler-id',
          forAddonSlug,
          pageSize: THEMES_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.byAddonSlug).toMatchObject({ 'addon-slug': undefined });
      // It should keep the add-ons by username so they can be added to
      // as is done on the UserProfile page.
      expect(state.byUsername).toMatchObject(firstState.byUsername);
    });

    it('does not remove the previously loaded add-ons for authorUsernames when type is different', () => {
      const { id: userId, username } = fakeTheme.authors[0];

      const prevState = reducer(
        undefined,
        loadAddonsByAuthors({
          addonType: ADDON_TYPE_THEME,
          addons: [fakeTheme],
          authorUsernames: [username],
          count: 1,
          pageSize: THEMES_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(prevState.byAddonId).toEqual({
        [fakeTheme.id]: createInternalAddon(fakeTheme),
      });

      const state = reducer(
        prevState,
        fetchAddonsByAuthors({
          addonType: ADDON_TYPE_EXTENSION,
          authorUsernames: [username],
          errorHandlerId: 'error-handler-id',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.byAddonId).toEqual({
        [fakeTheme.id]: createInternalAddon(fakeTheme),
      });
      expect(state.byUsername).toEqual({
        [username]: [fakeTheme.id],
      });
      expect(state.byUserId).toEqual({
        [userId]: [fakeTheme.id],
      });
    });

    it('does not remove the previously loaded add-ons for authorUsernames when forAddonSlug is specified', () => {
      const { slug: forAddonSlug } = fakeAddon;
      const { id: userId, username } = fakeAddon.authors[0];

      const prevState = reducer(
        undefined,
        loadAddonsByAuthors({
          addonType: ADDON_TYPE_EXTENSION,
          addons: [fakeAddon],
          authorUsernames: [username],
          count: 1,
          forAddonSlug,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(prevState.byAddonId).toEqual({
        [fakeAddon.id]: createInternalAddon(fakeAddon),
      });

      const state = reducer(
        prevState,
        fetchAddonsByAuthors({
          addonType: ADDON_TYPE_EXTENSION,
          authorUsernames: [username],
          errorHandlerId: 'error-handler-id',
          forAddonSlug,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.byAddonId).toEqual({
        [fakeAddon.id]: createInternalAddon(fakeAddon),
      });
      expect(state.byUsername).toEqual({
        [username]: [fakeAddon.id],
      });
      expect(state.byUserId).toEqual({
        [userId]: [fakeAddon.id],
      });
    });

    it('removes the previously loaded add-ons for authorUsernames', () => {
      const { id: userId, username } = fakeAddon.authors[0];

      const prevState = reducer(
        undefined,
        loadAddonsByAuthors({
          addonType: ADDON_TYPE_EXTENSION,
          addons: [fakeAddon],
          authorUsernames: [username],
          count: 1,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(prevState.byAddonId).toEqual({
        [fakeAddon.id]: createInternalAddon(fakeAddon),
      });

      const state = reducer(
        prevState,
        fetchAddonsByAuthors({
          addonType: ADDON_TYPE_EXTENSION,
          authorUsernames: [username],
          errorHandlerId: 'error-handler-id',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.byAddonId).toEqual({});
      expect(state.byUserId).toEqual({
        [userId]: [],
      });
      expect(state.byUsername).toEqual({
        [username]: [],
      });
    });

    it('sets the loading state for authorUsernames on fetch', () => {
      const state = reducer(
        undefined,
        fetchAddonsByAuthors({
          authorUsernames: ['author1'],
          errorHandlerId: 'error-handler-id',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.loadingFor).toMatchObject({
        [joinAuthorNamesAndAddonType(['author1'])]: true,
      });
    });

    it('sets the loading state for authorUsernames + addonType on fetch', () => {
      const state = reducer(
        undefined,
        fetchAddonsByAuthors({
          authorUsernames: ['author1'],
          addonType: ADDON_TYPE_THEME,
          errorHandlerId: 'error-handler-id',
          pageSize: THEMES_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.loadingFor).toMatchObject({
        [joinAuthorNamesAndAddonType(['author1'], ADDON_TYPE_THEME)]: true,
      });
    });
  });

  describe('loadAddonsByAuthors()', () => {
    const getParams = (extra = {}) => {
      return {
        addons: [],
        authorUsernames: ['fakeUsername'],
        count: 0,
        forAddonSlug: fakeAddon.slug,
        pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        ...extra,
      };
    };

    it('adds each add-on to each author array', () => {
      const firstAuthor = { ...fakeAuthor, id: 50, username: 'first' };
      const secondAuthor = { ...fakeAuthor, id: 60, username: 'second' };
      const authorUsernames = [firstAuthor.username, secondAuthor.username];
      const multiAuthorAddon = {
        ...fakeAddon,
        authors: [firstAuthor, secondAuthor],
      };
      const params = getParams({
        addons: [multiAuthorAddon],
        authorUsernames,
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
        authorUsernames: ['fakeUsername'],
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
        authorUsernames: ['test', 'test2', 'test3'],
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
        pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
      });

      const newState = reducer(undefined, loadAddonsByAuthors(params));

      expect(newState.byAddonSlug).toEqual({
        [fakeAddon.slug]: [fakeAddon.id],
      });
    });

    it('does not reset the byUserId dictionary when adding add-ons', () => {
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
        [fakeAuthorOne.id]: [addons.firstAddon.id],
        [fakeAuthorTwo.id]: [addons.firstAddon.id, addons.secondAddon.id],
        [fakeAuthorThree.id]: [addons.thirdAddon.id],
      });
    });

    it('does not reset the byUsername dictionary when adding add-ons', () => {
      const addons = fakeAddons();

      const firstParams = getParams({
        addons: [addons.firstAddon, addons.secondAddon],
        forAddonSlug: undefined,
      });

      let state = reducer(undefined, loadAddonsByAuthors(firstParams));

      expect(state.byUsername).toEqual({
        [fakeAuthorOne.username]: [addons.firstAddon.id],
        [fakeAuthorTwo.username]: [addons.firstAddon.id, addons.secondAddon.id],
      });

      const secondParams = getParams({
        addons: [addons.thirdAddon],
        forAddonSlug: undefined,
      });

      state = reducer(state, loadAddonsByAuthors(secondParams));

      expect(state.byUsername).toEqual({
        [fakeAuthorOne.username]: [addons.firstAddon.id],
        [fakeAuthorTwo.username]: [addons.firstAddon.id, addons.secondAddon.id],
        [fakeAuthorThree.username]: [addons.thirdAddon.id],
      });
    });

    it('sets the loading state for authorUsernames once loaded', () => {
      let state = reducer(
        undefined,
        fetchAddonsByAuthors({
          authorUsernames: ['author1'],
          errorHandlerId: 'error-handler-id',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.loadingFor).toMatchObject({
        [joinAuthorNamesAndAddonType(['author1'])]: true,
      });

      state = reducer(
        state,
        loadAddonsByAuthors({
          addons: [fakeAddon],
          authorUsernames: ['author1'],
          count: 1,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.loadingFor).toMatchObject({
        [joinAuthorNamesAndAddonType(['author1'])]: false,
      });
    });

    it('sets the loading state for authorUsernames + addonType once loaded', () => {
      let state = reducer(
        undefined,
        fetchAddonsByAuthors({
          authorUsernames: ['author1'],
          addonType: ADDON_TYPE_THEME,
          errorHandlerId: 'error-handler-id',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      state = reducer(
        state,
        loadAddonsByAuthors({
          addonType: ADDON_TYPE_THEME,
          addons: [fakeAddon],
          authorUsernames: ['author1'],
          count: 1,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.loadingFor).toMatchObject({
        [joinAuthorNamesAndAddonType(['author1'], ADDON_TYPE_THEME)]: false,
      });
    });

    it('sets the count for authorUsernames once loaded', () => {
      const count = 1;

      let state = reducer(
        undefined,
        fetchAddonsByAuthors({
          authorUsernames: ['author1'],
          errorHandlerId: 'error-handler-id',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.countFor).toMatchObject({
        [joinAuthorNamesAndAddonType(['author1'])]: null,
      });

      state = reducer(
        state,
        loadAddonsByAuthors({
          addons: [fakeAddon],
          authorUsernames: ['author1'],
          count,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.countFor).toMatchObject({
        [joinAuthorNamesAndAddonType(['author1'])]: count,
      });
    });

    it('sets the count for authorUsernames + addonType once loaded', () => {
      const count = 1;

      let state = reducer(
        undefined,
        fetchAddonsByAuthors({
          authorUsernames: ['author1'],
          addonType: ADDON_TYPE_THEME,
          errorHandlerId: 'error-handler-id',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      state = reducer(
        state,
        loadAddonsByAuthors({
          addonType: ADDON_TYPE_THEME,
          addons: [fakeAddon],
          authorUsernames: ['author1'],
          count,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.countFor).toMatchObject({
        [joinAuthorNamesAndAddonType(['author1'], ADDON_TYPE_THEME)]: count,
      });
    });
  });

  describe('getAddonsForSlug', () => {
    it('returns addons', () => {
      const addons = fakeAddons();
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          authorUsernames: ['fakeUsername'],
          count: Object.values(addons).length,
          forAddonSlug: 'test',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(getAddonsForSlug(state, 'test')).toEqual([
        createInternalAddon(addons.firstAddon),
        createInternalAddon(addons.secondAddon),
        createInternalAddon(addons.thirdAddon),
      ]);
    });

    it('returns nothing if no add-ons are found', () => {
      const addons = fakeAddons();
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          authorUsernames: ['fakeUsername'],
          count: Object.values(addons).length,
          forAddonSlug: 'test',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(getAddonsForSlug(state, 'not-a-slug')).toBeNull();
    });
  });

  describe('getAddonsForUsernames selector', () => {
    it('returns addons for a single author', () => {
      const addons = fakeAddons();
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          authorUsernames: ['fakeUsername'],
          count: Object.values(addons).length,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(getAddonsForUsernames(state, ['test2'])).toEqual([
        createInternalAddon(addons.firstAddon),
        createInternalAddon(addons.secondAddon),
      ]);
    });

    it('returns addons for multiple authors when only one has a loaded add-on', () => {
      const addons = fakeAddons();
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          authorUsernames: ['fakeUsername'],
          count: Object.values(addons).length,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(getAddonsForUsernames(state, ['test2', 'no-addons-user'])).toEqual(
        [
          createInternalAddon(addons.firstAddon),
          createInternalAddon(addons.secondAddon),
        ],
      );
    });

    it('returns addons for multiple authors of different add-ons', () => {
      const addons = fakeAddons();
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          authorUsernames: ['fakeUsername'],
          count: Object.values(addons).length,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(getAddonsForUsernames(state, ['test', 'test3'])).toEqual([
        createInternalAddon(addons.firstAddon),
        createInternalAddon(addons.thirdAddon),
      ]);
    });

    it('returns addons for multiple authors that share add-ons', () => {
      const addons = fakeAddons();
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          authorUsernames: ['test', 'test2'],
          count: Object.values(addons).length,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

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
      const authorUsernames = ['test', 'test2', 'test3'];
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          addonType: ADDON_TYPE_EXTENSION,
          authorUsernames,
          count: Object.values(addons).length,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(
        getAddonsForUsernames(
          state,
          authorUsernames,
          ADDON_TYPE_EXTENSION,
          addons.firstAddon.slug,
        ),
      ).toEqual([
        createInternalAddon(addons.secondAddon),
        createInternalAddon(addons.thirdAddon),
      ]);
    });

    it("returns lightweight themes when filtering for authors' themes", () => {
      const addons = fakeAddons({ type: ADDON_TYPE_THEME });

      const authorUsernames = ['test', 'test2', 'test3'];
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          addonType: ADDON_TYPE_THEME,
          authorUsernames,
          count: Object.values(addons).length,
          pageSize: THEMES_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(
        getAddonsForUsernames(state, authorUsernames, ADDON_TYPE_THEME),
      ).toEqual([
        createInternalAddon(addons.firstAddon),
        createInternalAddon(addons.secondAddon),
      ]);
    });

    it("returns static themes when filtering for authors' themes ", () => {
      const addons = fakeAddons({ type: ADDON_TYPE_STATIC_THEME });

      const authorUsernames = ['test', 'test2', 'test3'];
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          addonType: ADDON_TYPE_STATIC_THEME,
          authorUsernames,
          count: Object.values(addons).length,
          pageSize: THEMES_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(
        getAddonsForUsernames(state, authorUsernames, ADDON_TYPE_STATIC_THEME),
      ).toEqual([
        createInternalAddon(addons.firstAddon),
        createInternalAddon(addons.secondAddon),
      ]);
    });

    it("returns extensions when filtering for authors' extensions", () => {
      const addons = fakeAddons();

      const authorUsernames = ['test', 'test2', 'test3'];
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          addonType: ADDON_TYPE_EXTENSION,
          authorUsernames,
          count: Object.values(addons).length,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(
        getAddonsForUsernames(state, authorUsernames, ADDON_TYPE_EXTENSION),
      ).toEqual([
        createInternalAddon(addons.firstAddon),
        createInternalAddon(addons.secondAddon),
        createInternalAddon(addons.thirdAddon),
      ]);
    });

    it('returns nothing if no add-ons are found', () => {
      const addons = fakeAddons();
      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          authorUsernames: ['fakeUsername'],
          count: Object.values(addons).length,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(getAddonsForUsernames(state, ['nobody'])).toBeNull();
    });
  });

  describe('getLoadingForAuthorNames', () => {
    const params = {
      authorUsernames: ['author1'],
      errorHandlerId: 'error-handler-id',
      pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
    };

    it('returns loading for just authorUsernames', () => {
      const state = reducer(undefined, fetchAddonsByAuthors(params));

      expect(getLoadingForAuthorNames(state, ['author1'])).toEqual(true);
    });

    it('returns loading for authorUsernames + addonType', () => {
      const state = reducer(
        undefined,
        fetchAddonsByAuthors({
          ...params,
          addonType: ADDON_TYPE_THEME,
        }),
      );

      expect(
        getLoadingForAuthorNames(state, ['author1'], ADDON_TYPE_THEME),
      ).toEqual(true);
    });

    it('returns null when there is no match', () => {
      const state = reducer(
        undefined,
        fetchAddonsByAuthors({
          ...params,
          authorUsernames: ['someOtherAuthor'],
        }),
      );

      expect(getLoadingForAuthorNames(state, ['author2'])).toEqual(null);
    });

    it('returns null when no authorUsernames provided', () => {
      const state = reducer(undefined, fetchAddonsByAuthors(params));

      expect(getLoadingForAuthorNames(state, [])).toEqual(null);
    });
  });

  describe('getCountForAuthorNames', () => {
    const params = {
      addons: [],
      authorUsernames: ['author1'],
      count: 0,
      errorHandlerId: 'error-handler-id',
      pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
    };

    it('returns count for just authorUsernames', () => {
      const count = 123;

      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          ...params,
          count,
        }),
      );

      expect(getCountForAuthorNames(state, ['author1'])).toEqual(count);
    });

    it('returns count for authorUsernames + addonType', () => {
      const count = 123;

      const state = reducer(
        undefined,
        loadAddonsByAuthors({
          ...params,
          addonType: ADDON_TYPE_THEME,
          count,
        }),
      );

      expect(
        getCountForAuthorNames(state, ['author1'], ADDON_TYPE_THEME),
      ).toEqual(count);
    });

    it('returns null when there is no match', () => {
      const state = reducer(undefined, loadAddonsByAuthors(params));

      expect(getCountForAuthorNames(state, ['author2'])).toEqual(null);
    });

    it('returns null when no authorUsernames provided', () => {
      const state = reducer(undefined, loadAddonsByAuthors(params));

      expect(getCountForAuthorNames(state, [])).toEqual(null);
    });

    it('resets count when fetching add-ons by authors', () => {
      const count = 123;

      const prevState = reducer(
        undefined,
        loadAddonsByAuthors({
          ...params,
          count,
        }),
      );

      expect(getCountForAuthorNames(prevState, ['author1'])).toEqual(count);

      const fetchParams = { ...params };
      delete fetchParams.addons;
      delete fetchParams.count;

      const state = reducer(prevState, fetchAddonsByAuthors(fetchParams));

      expect(getCountForAuthorNames(state, ['author1'])).toEqual(null);
    });
  });

  describe('joinAuthorNamesAndAddonType', () => {
    it('returns authorUsernames', () => {
      expect(joinAuthorNamesAndAddonType(['author1', 'author2'])).toEqual(
        'author1-author2',
      );
    });

    it('returns authorUsernames + addonType', () => {
      expect(
        joinAuthorNamesAndAddonType(['author1', 'author2'], ADDON_TYPE_THEME),
      ).toEqual(`author1-author2-${ADDON_TYPE_THEME}`);
    });

    it('handles a single authorName', () => {
      expect(
        joinAuthorNamesAndAddonType(['author1'], ADDON_TYPE_THEME),
      ).toEqual(`author1-${ADDON_TYPE_THEME}`);
    });
  });
});
