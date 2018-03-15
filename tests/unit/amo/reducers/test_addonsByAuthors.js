import { ADDON_TYPE_THEME } from 'core/constants';
import reducer, {
  ADDONS_BY_AUTHORS_PAGE_SIZE,
  fetchAddonsByAuthors,
  initialState,
  loadAddonsByAuthors,
} from 'amo/reducers/addonsByAuthors';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon } from 'tests/unit/amo/helpers';


describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = reducer(undefined, {});
      expect(state).toEqual(initialState);
    });

    it('ignores unrelated actions', () => {
      // Load some initial state to be sure that an unrelated action does not
      // change it.
      const state = reducer(undefined, loadAddonsByAuthors({
        excludeAddonBySlug: fakeAddon.slug,
        addons: [fakeAddon],
      }));
      const newState = reducer(state, { type: 'UNRELATED' });
      expect(newState).toEqual(state);
    });

    it('allows an empty list of add-ons', () => {
      const state = reducer(undefined, loadAddonsByAuthors({
        excludeAddonBySlug: 'addon-slug',
        addons: [],
      }));
      expect(state.byAddonSlug).toEqual({
        'addon-slug': [],
      });
    });

    it('adds related add-ons by slug', () => {
      const state = reducer(undefined, loadAddonsByAuthors({
        excludeAddonBySlug: 'addon-slug',
        addons: [fakeAddon],
      }));
      expect(state.byAddonSlug).toEqual({
        'addon-slug': [createInternalAddon(fakeAddon)],
      });
    });

    it('always ensures the page size is consistent', () => {
      const excludeAddonBySlug = 'addon-slug';
      const state = reducer(undefined, loadAddonsByAuthors({
        excludeAddonBySlug,
        // This is the case where there are more add-ons loaded than needed.
        addons: Array(ADDONS_BY_AUTHORS_PAGE_SIZE + 2).fill(fakeAddon),
      }));
      expect(state.byAddonSlug[excludeAddonBySlug])
        .toHaveLength(ADDONS_BY_AUTHORS_PAGE_SIZE);
    });

    it('returns state if no excluded slug is specified', () => {
      const excludeAddonBySlug = 'addon-slug';
      const fakeInternalAddon = createInternalAddon(fakeAddon);

      const previousState = reducer(undefined, loadAddonsByAuthors({
        addons: [fakeAddon],
        excludeAddonBySlug,
      }));
      expect(previousState.byAddonSlug)
        .toEqual({ 'addon-slug': [fakeInternalAddon] });

      const state = reducer(previousState, fetchAddonsByAuthors({
        authors: ['author2'],
        addonType: ADDON_TYPE_THEME,
        errorHandlerId: 'error-handler-id',
      }));

      expect(state.byAddonSlug).toEqual({ 'addon-slug': [fakeInternalAddon] });
    });

    it('resets the loaded add-ons', () => {
      const excludeAddonBySlug = 'addon-slug';

      const previousState = reducer(undefined, loadAddonsByAuthors({
        addons: [fakeAddon],
        excludeAddonBySlug,
      }));
      expect(previousState.byAddonSlug)
        .toEqual({ 'addon-slug': [createInternalAddon(fakeAddon)] });

      const state = reducer(previousState, fetchAddonsByAuthors({
        authors: ['author1'],
        addonType: ADDON_TYPE_THEME,
        errorHandlerId: 'error-handler-id',
        excludeAddonBySlug,
      }));

      expect(state.byAddonSlug).toEqual({ 'addon-slug': undefined });
    });
  });

  describe('loadAddonsByAuthors()', () => {
    const getParams = () => {
      return {
        addons: [fakeAddon],
        excludeAddonBySlug: fakeAddon.slug,
      };
    };

    it('returns state if no excludeAddonBySlug specified', () => {
      const params = getParams();
      delete params.excludeAddonBySlug;

      const newState = reducer(initialState, loadAddonsByAuthors(params));

      expect(newState).toEqual(initialState);
    });

    it('returns modified state if excludeAddonBySlug is set', () => {
      const params = getParams();

      const newState = reducer(initialState, loadAddonsByAuthors(params));

      expect(newState).toMatchObject({
        byAddonSlug: {
          [fakeAddon.slug]: [createInternalAddon(fakeAddon)],
        },
      });
    });
  });
});
