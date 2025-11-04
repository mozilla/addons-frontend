import { ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import reducer, {
  EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
  THEMES_BY_AUTHORS_PAGE_SIZE,
  fetchAddonsByAuthors,
  getAddonsForSlug,
  getAddonsForAuthorIds,
  getCountForAuthorIds,
  getLoadingForAuthorIds,
  initialState,
  joinAuthorIdsAndAddonType,
  loadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { setLang } from 'amo/reducers/api';
import {
  createInternalAddonWithLang,
  fakeAddon,
  fakeAuthor,
  fakeTheme,
} from 'tests/unit/helpers';

describe(__filename, () => {
  // We need a state with setLang called for any tests that load add-ons.
  const lang = 'en-US';
  const stateWithLang = reducer(undefined, setLang(lang));

  const randomAuthorId1 = 123;
  const randomAuthorId2 = 456;

  const fakeAuthorOne = { ...fakeAuthor, username: 'test', id: 51 };
  const fakeAuthorTwo = { ...fakeAuthor, username: 'test2', id: 61 };
  const fakeAuthorThree = { ...fakeAuthor, username: 'test3', id: 71 };

  const fakeExternalAddons = ({
    type = ADDON_TYPE_EXTENSION,
    firstAddonProps = {},
    secondAddonProps = {},
    thirdAddonProps = {},
  } = {}) => {
    const firstAddon = {
      ...fakeAddon,
      type,
      slug: 'first-addon',
      id: 6,
      authors: [fakeAuthorOne, fakeAuthorTwo],
      ...firstAddonProps,
    };
    const secondAddon = {
      ...fakeAddon,
      type,
      slug: 'second-addon',
      id: 7,
      authors: [fakeAuthorTwo],
      ...secondAddonProps,
    };
    const thirdAddon = {
      ...fakeAddon,
      slug: 'third-addon',
      id: 8,
      authors: [fakeAuthorThree],
      ...thirdAddonProps,
    };

    return { firstAddon, secondAddon, thirdAddon };
  };

  const _loadAddonsByAuthors = ({ addons = [], ...others } = {}) => {
    return loadAddonsByAuthors({
      addons,
      authorIds: addons.map((addon) => addon.authors[0].id),
      count: addons.length,
      pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
      ...others,
    });
  };

  describe('reducer', () => {
    it('initializes properly', () => {
      const state = reducer(undefined, {});

      expect(state).toEqual(initialState);
    });

    it('ignores unrelated actions', () => {
      // Load some initial state to be sure that an unrelated action does not
      // change it.
      const state = reducer(
        stateWithLang,
        loadAddonsByAuthors({
          addons: [fakeAddon],
          authorIds: [fakeAddon.authors[0].id],
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
        stateWithLang,
        loadAddonsByAuthors({
          addons: [],
          authorIds: [fakeAddon.authors[0].id],
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
        stateWithLang,
        loadAddonsByAuthors({
          addons: [fakeAddon],
          authorIds: [fakeAddon.authors[0].id],
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
        stateWithLang,
        loadAddonsByAuthors({
          forAddonSlug,
          // This is the case where there are more add-ons loaded than needed.
          addons: Array(EXTENSIONS_BY_AUTHORS_PAGE_SIZE + 2).fill(fakeAddon),
          authorIds: [fakeAddon.authors[0].id],
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
        stateWithLang,
        loadAddonsByAuthors({
          forAddonSlug,
          // This is the case where there are more add-ons loaded than needed.
          addons: Array(THEMES_BY_AUTHORS_PAGE_SIZE + 2).fill(fakeAddon),
          authorIds: [fakeAddon.authors[0].id],
          addonType: ADDON_TYPE_STATIC_THEME,
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
        stateWithLang,
        loadAddonsByAuthors({
          addons: [fakeAddon],
          authorIds: [fakeAddon.authors[0].id],
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
          authorIds: [randomAuthorId2],
          addonType: ADDON_TYPE_STATIC_THEME,
          errorHandlerId: 'error-handler-id',
          pageSize: THEMES_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.byAddonSlug).toEqual({ 'addon-slug': [fakeAddon.id] });
    });

    it('resets the loaded add-ons for the slug', () => {
      const forAddonSlug = 'addon-slug';

      const firstState = reducer(
        stateWithLang,
        loadAddonsByAuthors({
          addons: [fakeAddon],
          authorIds: [fakeAddon.authors[0].id],
          count: 1,
          forAddonSlug,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(firstState.byAddonSlug).toEqual({ 'addon-slug': [fakeAddon.id] });

      const state = reducer(
        firstState,
        fetchAddonsByAuthors({
          addonType: ADDON_TYPE_STATIC_THEME,
          authorIds: [fakeAddon.authors[0].id],
          errorHandlerId: 'error-handler-id',
          forAddonSlug,
          pageSize: THEMES_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.byAddonSlug).toMatchObject({ 'addon-slug': undefined });
    });

    it('does not remove the previously loaded add-ons for authorIds when type is different', () => {
      const { id: userId } = fakeTheme.authors[0];

      const prevState = reducer(
        stateWithLang,
        loadAddonsByAuthors({
          addonType: ADDON_TYPE_STATIC_THEME,
          addons: [fakeTheme],
          authorIds: [userId],
          count: 1,
          pageSize: THEMES_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(prevState.byAddonId).toEqual({
        [fakeTheme.id]: createInternalAddonWithLang(fakeTheme),
      });

      const state = reducer(
        prevState,
        fetchAddonsByAuthors({
          addonType: ADDON_TYPE_EXTENSION,
          authorIds: [userId],
          errorHandlerId: 'error-handler-id',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.byAddonId).toEqual({
        [fakeTheme.id]: createInternalAddonWithLang(fakeTheme),
      });
      expect(state.byAuthorId).toEqual({
        [userId]: [fakeTheme.id],
      });
    });

    it('removes the previously loaded add-ons for authorIds', () => {
      const { id: userId } = fakeAddon.authors[0];

      const prevState = reducer(
        stateWithLang,
        loadAddonsByAuthors({
          addonType: ADDON_TYPE_EXTENSION,
          addons: [fakeAddon],
          authorIds: [userId],
          count: 1,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(prevState.byAddonId).toEqual({
        [fakeAddon.id]: createInternalAddonWithLang(fakeAddon),
      });
      expect(prevState.byAuthorId).toEqual({
        [userId]: [fakeAddon.id],
      });

      const state = reducer(
        prevState,
        fetchAddonsByAuthors({
          addonType: ADDON_TYPE_EXTENSION,
          authorIds: [userId],
          errorHandlerId: 'error-handler-id',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(prevState.byAddonId).toEqual({
        [fakeAddon.id]: createInternalAddonWithLang(fakeAddon),
      });
      expect(state.byAuthorId).toEqual({
        [userId]: [],
      });
    });

    it('sets the loading state for authorIds on fetch', () => {
      const state = reducer(
        undefined,
        fetchAddonsByAuthors({
          authorIds: [randomAuthorId1],
          errorHandlerId: 'error-handler-id',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.loadingFor).toMatchObject({
        [joinAuthorIdsAndAddonType([randomAuthorId1])]: true,
      });
    });

    it('sets the loading state for authorIds + addonType on fetch', () => {
      const state = reducer(
        undefined,
        fetchAddonsByAuthors({
          authorIds: [randomAuthorId1],
          addonType: ADDON_TYPE_STATIC_THEME,
          errorHandlerId: 'error-handler-id',
          pageSize: THEMES_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.loadingFor).toMatchObject({
        [joinAuthorIdsAndAddonType([randomAuthorId1], ADDON_TYPE_STATIC_THEME)]:
          true,
      });
    });
  });

  describe('loadAddonsByAuthors()', () => {
    const getParams = (extra = {}) => {
      return {
        addons: [],
        authorIds: [randomAuthorId1],
        count: 0,
        forAddonSlug: fakeAddon.slug,
        pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        ...extra,
      };
    };

    it('adds each add-on to each author array', () => {
      const firstAuthor = { ...fakeAuthor, id: 50, username: 'first' };
      const secondAuthor = { ...fakeAuthor, id: 60, username: 'second' };
      const authorIds = [firstAuthor.username, secondAuthor.username];
      const multiAuthorAddon = {
        ...fakeAddon,
        authors: [firstAuthor, secondAuthor],
      };
      const params = getParams({
        addons: [multiAuthorAddon],
        authorIds,
      });

      const newState = reducer(stateWithLang, loadAddonsByAuthors(params));

      expect(newState.byAuthorId).toEqual({
        [firstAuthor.id]: [multiAuthorAddon.id],
        [secondAuthor.id]: [multiAuthorAddon.id],
      });
    });

    it('adds each different add-on to the byAddonId dictionary', () => {
      const addons = fakeExternalAddons();
      const params = getParams({
        addons: Object.values(addons),
        authorIds: [randomAuthorId1],
        forAddonSlug: undefined,
      });

      const newState = reducer(stateWithLang, loadAddonsByAuthors(params));

      expect(newState.byAddonId).toEqual({
        [addons.firstAddon.id]: createInternalAddonWithLang(addons.firstAddon),
        [addons.secondAddon.id]: createInternalAddonWithLang(
          addons.secondAddon,
        ),
        [addons.thirdAddon.id]: createInternalAddonWithLang(addons.thirdAddon),
      });
    });

    it('adds each different add-on to each author array', () => {
      // See fakeExternalAddons() output, above.
      const firstAuthorId = fakeAuthorOne.id;
      const secondAuthorId = fakeAuthorTwo.id;
      const thirdAuthorId = fakeAuthorThree.id;
      const addons = fakeExternalAddons();

      const params = getParams({
        addons: Object.values(addons),
        authorIds: [fakeAuthorOne.id, fakeAuthorTwo.id, fakeAuthorThree.id],
        forAddonSlug: undefined,
      });

      const newState = reducer(stateWithLang, loadAddonsByAuthors(params));

      expect(newState.byAuthorId).toEqual({
        [firstAuthorId]: [addons.firstAddon.id],
        [secondAuthorId]: [addons.firstAddon.id, addons.secondAddon.id],
        [thirdAuthorId]: [addons.thirdAddon.id],
      });
    });

    it('does not modify byAddonSlug if forAddonSlug is not set', () => {
      const params = getParams();
      delete params.forAddonSlug;

      const newState = reducer(stateWithLang, loadAddonsByAuthors(params));

      expect(newState.byAddonSlug).toEqual(initialState.byAddonSlug);
    });

    it('modifies byAddonSlug if forAddonSlug is set', () => {
      const params = getParams({
        addons: [fakeAddon],
        forAddonSlug: fakeAddon.slug,
        pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
      });

      const newState = reducer(stateWithLang, loadAddonsByAuthors(params));

      expect(newState.byAddonSlug).toEqual({
        [fakeAddon.slug]: [fakeAddon.id],
      });
    });

    it('does not reset the byAuthorId dictionary when adding add-ons', () => {
      const addons = fakeExternalAddons();

      const firstParams = getParams({
        addons: [addons.firstAddon, addons.secondAddon],
        forAddonSlug: undefined,
      });

      let state = reducer(stateWithLang, loadAddonsByAuthors(firstParams));

      const secondParams = getParams({
        addons: [addons.thirdAddon],
        forAddonSlug: undefined,
      });

      state = reducer(state, loadAddonsByAuthors(secondParams));

      expect(state.byAuthorId).toEqual({
        [fakeAuthorOne.id]: [addons.firstAddon.id],
        [fakeAuthorTwo.id]: [addons.firstAddon.id, addons.secondAddon.id],
        [fakeAuthorThree.id]: [addons.thirdAddon.id],
      });
    });

    it('sets the loading state for authorIds once loaded', () => {
      let state = reducer(
        stateWithLang,
        fetchAddonsByAuthors({
          authorIds: [randomAuthorId1],
          errorHandlerId: 'error-handler-id',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.loadingFor).toMatchObject({
        [joinAuthorIdsAndAddonType([randomAuthorId1])]: true,
      });

      state = reducer(
        state,
        loadAddonsByAuthors({
          addons: [fakeAddon],
          authorIds: [randomAuthorId1],
          count: 1,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.loadingFor).toMatchObject({
        [joinAuthorIdsAndAddonType([randomAuthorId1])]: false,
      });
    });

    it('sets the loading state for authorIds + addonType once loaded', () => {
      let state = reducer(
        stateWithLang,
        fetchAddonsByAuthors({
          authorIds: [randomAuthorId1],
          addonType: ADDON_TYPE_STATIC_THEME,
          errorHandlerId: 'error-handler-id',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      state = reducer(
        state,
        loadAddonsByAuthors({
          addonType: ADDON_TYPE_STATIC_THEME,
          addons: [fakeAddon],
          authorIds: [randomAuthorId1],
          count: 1,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.loadingFor).toMatchObject({
        [joinAuthorIdsAndAddonType([randomAuthorId1], ADDON_TYPE_STATIC_THEME)]:
          false,
      });
    });

    it('sets the count for authorIds once loaded', () => {
      const count = 1;

      let state = reducer(
        stateWithLang,
        fetchAddonsByAuthors({
          authorIds: [randomAuthorId1],
          errorHandlerId: 'error-handler-id',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.countFor).toMatchObject({
        [joinAuthorIdsAndAddonType([randomAuthorId1])]: null,
      });

      state = reducer(
        state,
        loadAddonsByAuthors({
          addons: [fakeAddon],
          authorIds: [randomAuthorId1],
          count,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.countFor).toMatchObject({
        [joinAuthorIdsAndAddonType([randomAuthorId1])]: count,
      });
    });

    it('sets the count for authorIds + addonType once loaded', () => {
      const count = 1;

      let state = reducer(
        stateWithLang,
        fetchAddonsByAuthors({
          authorIds: [randomAuthorId1],
          addonType: ADDON_TYPE_STATIC_THEME,
          errorHandlerId: 'error-handler-id',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      state = reducer(
        state,
        loadAddonsByAuthors({
          addonType: ADDON_TYPE_STATIC_THEME,
          addons: [fakeAddon],
          authorIds: [randomAuthorId1],
          count,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(state.countFor).toMatchObject({
        [joinAuthorIdsAndAddonType([randomAuthorId1], ADDON_TYPE_STATIC_THEME)]:
          count,
      });
    });
  });

  describe('getAddonsForSlug', () => {
    it('returns addons', () => {
      const addons = fakeExternalAddons();
      const state = reducer(
        stateWithLang,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          authorIds: [randomAuthorId1],
          count: Object.values(addons).length,
          forAddonSlug: 'test',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(getAddonsForSlug(state, 'test')).toEqual([
        createInternalAddonWithLang(addons.firstAddon),
        createInternalAddonWithLang(addons.secondAddon),
        createInternalAddonWithLang(addons.thirdAddon),
      ]);
    });

    it('returns nothing if no add-ons are found', () => {
      const addons = fakeExternalAddons();
      const state = reducer(
        stateWithLang,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          authorIds: [randomAuthorId1],
          count: Object.values(addons).length,
          forAddonSlug: 'test',
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(getAddonsForSlug(state, 'not-a-slug')).toBeNull();
    });
  });

  describe('getAddonsForAuthorIds selector', () => {
    it('returns addons for a single author', () => {
      const addons = fakeExternalAddons();
      const state = reducer(
        stateWithLang,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          authorIds: [randomAuthorId1],
          count: Object.values(addons).length,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(getAddonsForAuthorIds(state, [fakeAuthorTwo.id])).toEqual([
        createInternalAddonWithLang(addons.firstAddon),
        createInternalAddonWithLang(addons.secondAddon),
      ]);
    });

    it('returns addons for multiple authors when only one has a loaded add-on', () => {
      const addonsMap = fakeExternalAddons({
        firstAddonProps: {
          authors: [fakeAuthorOne, fakeAuthorTwo],
        },
        secondAddonProps: {
          authors: [fakeAuthorTwo],
        },
        thirdAddonProps: {
          authors: [fakeAuthorThree],
        },
      });
      const addons = Object.values(addonsMap);

      const state = reducer(stateWithLang, _loadAddonsByAuthors({ addons }));

      expect(
        getAddonsForAuthorIds(state, [fakeAuthorTwo.id, randomAuthorId2]),
      ).toEqual([
        createInternalAddonWithLang(addonsMap.firstAddon),
        createInternalAddonWithLang(addonsMap.secondAddon),
      ]);
    });

    it('returns addons for multiple authors of different add-ons', () => {
      const addonsMap = fakeExternalAddons({
        firstAddonProps: {
          authors: [fakeAuthorOne, fakeAuthorTwo],
        },
        secondAddonProps: {
          authors: [fakeAuthorTwo],
        },
        thirdAddonProps: {
          authors: [fakeAuthorThree],
        },
      });
      const addons = Object.values(addonsMap);

      const state = reducer(stateWithLang, _loadAddonsByAuthors({ addons }));

      expect(
        getAddonsForAuthorIds(state, [fakeAuthorOne.id, fakeAuthorThree.id]),
      ).toEqual([
        createInternalAddonWithLang(addonsMap.firstAddon),
        createInternalAddonWithLang(addonsMap.thirdAddon),
      ]);
    });

    it('returns addons for multiple authors that share add-ons', () => {
      const addonsMap = fakeExternalAddons({
        firstAddonProps: {
          authors: [fakeAuthorOne, fakeAuthorTwo],
        },
        secondAddonProps: {
          authors: [fakeAuthorTwo],
        },
        thirdAddonProps: {
          authors: [fakeAuthorThree],
        },
      });
      const addons = Object.values(addonsMap);

      const state = reducer(stateWithLang, _loadAddonsByAuthors({ addons }));

      expect(
        getAddonsForAuthorIds(state, [fakeAuthorOne.id, fakeAuthorTwo.id]),
      ).toEqual([
        createInternalAddonWithLang(addonsMap.firstAddon),
        createInternalAddonWithLang(addonsMap.secondAddon),
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
      const addons = fakeExternalAddons();
      const authorIds = [
        fakeAuthorOne.id,
        fakeAuthorTwo.id,
        fakeAuthorThree.id,
      ];
      const state = reducer(
        stateWithLang,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          addonType: ADDON_TYPE_EXTENSION,
          authorIds,
          count: Object.values(addons).length,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(
        getAddonsForAuthorIds(
          state,
          authorIds,
          ADDON_TYPE_EXTENSION,
          addons.firstAddon.slug,
        ),
      ).toEqual([
        createInternalAddonWithLang(addons.secondAddon),
        createInternalAddonWithLang(addons.thirdAddon),
      ]);
    });

    it("returns static themes when filtering for authors' themes", () => {
      const addons = fakeExternalAddons({ type: ADDON_TYPE_STATIC_THEME });

      const authorIds = [
        fakeAuthorOne.id,
        fakeAuthorTwo.id,
        fakeAuthorThree.id,
      ];
      const state = reducer(
        stateWithLang,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          addonType: ADDON_TYPE_STATIC_THEME,
          authorIds,
          count: Object.values(addons).length,
          pageSize: THEMES_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(
        getAddonsForAuthorIds(state, authorIds, ADDON_TYPE_STATIC_THEME),
      ).toEqual([
        createInternalAddonWithLang(addons.firstAddon),
        createInternalAddonWithLang(addons.secondAddon),
      ]);
    });

    it("returns extensions when filtering for authors' extensions", () => {
      const addons = fakeExternalAddons();

      const authorIds = [
        fakeAuthorOne.id,
        fakeAuthorTwo.id,
        fakeAuthorThree.id,
      ];
      const state = reducer(
        stateWithLang,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          addonType: ADDON_TYPE_EXTENSION,
          authorIds,
          count: Object.values(addons).length,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(
        getAddonsForAuthorIds(state, authorIds, ADDON_TYPE_EXTENSION),
      ).toEqual([
        createInternalAddonWithLang(addons.firstAddon),
        createInternalAddonWithLang(addons.secondAddon),
        createInternalAddonWithLang(addons.thirdAddon),
      ]);
    });

    it('returns nothing if no add-ons are found', () => {
      const addons = fakeExternalAddons();
      const state = reducer(
        stateWithLang,
        loadAddonsByAuthors({
          addons: Object.values(addons),
          authorIds: [randomAuthorId1],
          count: Object.values(addons).length,
          pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
        }),
      );

      expect(getAddonsForAuthorIds(state, [randomAuthorId1 + 2])).toBeNull();
    });
  });

  describe('getLoadingForAuthorIds', () => {
    const params = {
      authorIds: [randomAuthorId1],
      errorHandlerId: 'error-handler-id',
      pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
    };

    it('returns loading for just authorIds', () => {
      const state = reducer(undefined, fetchAddonsByAuthors(params));

      expect(getLoadingForAuthorIds(state, [randomAuthorId1])).toEqual(true);
    });

    it('returns loading for authorIds + addonType', () => {
      const state = reducer(
        undefined,
        fetchAddonsByAuthors({
          ...params,
          addonType: ADDON_TYPE_STATIC_THEME,
        }),
      );

      expect(
        getLoadingForAuthorIds(
          state,
          [randomAuthorId1],
          ADDON_TYPE_STATIC_THEME,
        ),
      ).toEqual(true);
    });

    it('returns null when there is no match', () => {
      const state = reducer(
        undefined,
        fetchAddonsByAuthors({
          ...params,
          authorIds: [randomAuthorId1],
        }),
      );

      expect(getLoadingForAuthorIds(state, [randomAuthorId2])).toEqual(null);
    });

    it('returns null when no authorIds provided', () => {
      const state = reducer(undefined, fetchAddonsByAuthors(params));

      expect(getLoadingForAuthorIds(state, [])).toEqual(null);
    });

    it('returns false when loading is defined', () => {
      const state = reducer(
        stateWithLang,
        loadAddonsByAuthors({
          ...params,
          addons: [],
          count: 0,
        }),
      );

      expect(getLoadingForAuthorIds(state, [randomAuthorId1])).toEqual(false);
    });
  });

  describe('getCountForAuthorIds', () => {
    const params = {
      addons: [],
      authorIds: [randomAuthorId1],
      count: 0,
      errorHandlerId: 'error-handler-id',
      pageSize: EXTENSIONS_BY_AUTHORS_PAGE_SIZE,
    };

    it('returns count for just authorIds', () => {
      const count = 123;

      const state = reducer(
        stateWithLang,
        loadAddonsByAuthors({
          ...params,
          count,
        }),
      );

      expect(getCountForAuthorIds(state, [randomAuthorId1])).toEqual(count);
    });

    it('returns count for authorIds + addonType', () => {
      const count = 123;

      const state = reducer(
        stateWithLang,
        loadAddonsByAuthors({
          ...params,
          addonType: ADDON_TYPE_STATIC_THEME,
          count,
        }),
      );

      expect(
        getCountForAuthorIds(state, [randomAuthorId1], ADDON_TYPE_STATIC_THEME),
      ).toEqual(count);
    });

    it('returns null when there is no match', () => {
      const state = reducer(stateWithLang, loadAddonsByAuthors(params));

      expect(getCountForAuthorIds(state, [randomAuthorId2])).toEqual(null);
    });

    it('returns null when no authorIds provided', () => {
      const state = reducer(stateWithLang, loadAddonsByAuthors(params));

      expect(getCountForAuthorIds(state, [])).toEqual(null);
    });

    it('resets count when fetching add-ons by authors', () => {
      const count = 123;

      const prevState = reducer(
        stateWithLang,
        loadAddonsByAuthors({
          ...params,
          count,
        }),
      );

      expect(getCountForAuthorIds(prevState, [randomAuthorId1])).toEqual(count);

      const fetchParams = { ...params };
      delete fetchParams.addons;
      delete fetchParams.count;

      const state = reducer(prevState, fetchAddonsByAuthors(fetchParams));

      expect(getCountForAuthorIds(state, [randomAuthorId1])).toEqual(null);
    });
  });

  describe('joinAuthorIdsAndAddonType', () => {
    it('returns authorIds', () => {
      expect(
        joinAuthorIdsAndAddonType([randomAuthorId1, randomAuthorId2]),
      ).toEqual(`${randomAuthorId1}-${randomAuthorId2}`);
    });

    it('returns authorIds + addonType', () => {
      expect(
        joinAuthorIdsAndAddonType(
          [randomAuthorId1, randomAuthorId2],
          ADDON_TYPE_STATIC_THEME,
        ),
      ).toEqual(
        `${randomAuthorId1}-${randomAuthorId2}-${ADDON_TYPE_STATIC_THEME}`,
      );
    });

    it('handles a single author ID', () => {
      expect(
        joinAuthorIdsAndAddonType([randomAuthorId1], ADDON_TYPE_STATIC_THEME),
      ).toEqual(`${randomAuthorId1}-${ADDON_TYPE_STATIC_THEME}`);
    });
  });
});
