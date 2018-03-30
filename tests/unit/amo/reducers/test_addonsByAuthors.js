import { ADDON_TYPE_THEME } from 'core/constants';
import reducer, {
  ADDONS_BY_AUTHORS_PAGE_SIZE,
  fetchAddonsByAuthors,
  getAddonsForSlug,
  initialState,
  loadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon, fakeAuthor } from 'tests/unit/amo/helpers';


describe(__filename, () => {
  function fakeAddons() {
    const firstAddon = {
      ...fakeAddon,
      id: 6,
      authors: [
        { username: 'test', id: 51 },
        { username: 'test2', id: 61 },
      ],
    };
    const secondAddon = {
      ...fakeAddon, id: 7, authors: [{ username: 'test2', id: 61 }],
    };
    const thirdAddon = {
      ...fakeAddon, id: 8, authors: [{ username: 'test3', id: 71 }],
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
        forAddonSlug: fakeAddon.slug,
        addons: [fakeAddon],
      }));
      const newState = reducer(state, { type: 'UNRELATED' });
      expect(newState).toEqual(state);
    });

    it('allows an empty list of add-ons', () => {
      const state = reducer(undefined, loadAddonsByAuthors({
        forAddonSlug: 'addon-slug',
        addons: [],
      }));
      expect(state.byAddonSlug).toEqual({
        'addon-slug': [],
      });
    });

    it('adds related add-ons by slug', () => {
      const state = reducer(undefined, loadAddonsByAuthors({
        forAddonSlug: 'addon-slug',
        addons: [fakeAddon],
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
      }));
      expect(state.byAddonSlug[forAddonSlug])
        .toHaveLength(ADDONS_BY_AUTHORS_PAGE_SIZE);
    });

    it('returns state if no excluded slug is specified', () => {
      const forAddonSlug = 'addon-slug';

      const previousState = reducer(undefined, loadAddonsByAuthors({
        addons: [fakeAddon],
        forAddonSlug,
      }));
      expect(previousState.byAddonSlug)
        .toEqual({ 'addon-slug': [fakeAddon.id] });

      const state = reducer(previousState, fetchAddonsByAuthors({
        authors: ['author2'],
        addonType: ADDON_TYPE_THEME,
        errorHandlerId: 'error-handler-id',
      }));

      expect(state.byAddonSlug).toEqual({ 'addon-slug': [fakeAddon.id] });
    });

    it('resets the loaded add-ons', () => {
      const forAddonSlug = 'addon-slug';

      const previousState = reducer(undefined, loadAddonsByAuthors({
        addons: [fakeAddon],
        forAddonSlug,
      }));
      expect(previousState.byAddonSlug)
        .toEqual({ 'addon-slug': [fakeAddon.id] });

      const state = reducer(previousState, fetchAddonsByAuthors({
        authors: ['author1'],
        addonType: ADDON_TYPE_THEME,
        errorHandlerId: 'error-handler-id',
        forAddonSlug,
      }));

      expect(state.byAddonSlug).toMatchObject({ 'addon-slug': undefined });
      expect(state.byUsername).toMatchObject({ author1: undefined });
    });
  });

  describe('loadAddonsByAuthors()', () => {
    const getParams = (extra = {}) => {
      return {
        addons: [],
        forAddonSlug: fakeAddon.slug,
        ...extra,
      };
    };

    it('adds each add-on to each author array', () => {
      const firstAuthor = { ...fakeAuthor, id: 50 };
      const secondAuthor = { ...fakeAuthor, id: 60 };
      const multiAuthorAddon = {
        ...fakeAddon,
        authors: [firstAuthor, secondAuthor],
      };
      const params = getParams({ addons: [multiAuthorAddon] });

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
  });

  describe('getAddonsForSlug', () => {
    it('returns addons', () => {
      const addons = fakeAddons();
      const state = reducer(undefined, loadAddonsByAuthors({
        addons: Object.values(addons),
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
        forAddonSlug: 'test',
      }));

      expect(getAddonsForSlug(state, 'not-a-slug')).toBeNull();
    });
  });
});
