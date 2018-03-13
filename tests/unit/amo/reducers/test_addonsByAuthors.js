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
        slug: fakeAddon.slug,
        addons: [fakeAddon],
      }));
      const newState = reducer(state, { type: 'UNRELATED' });
      expect(newState).toEqual(state);
    });

    it('allows an empty list of add-ons', () => {
      const state = reducer(undefined, loadAddonsByAuthors({
        slug: 'addon-slug',
        addons: [],
      }));
      expect(state.byAddonSlug).toEqual({
        'addon-slug': [],
      });
    });

    it('adds related add-ons by slug', () => {
      const state = reducer(undefined, loadAddonsByAuthors({
        slug: 'addon-slug',
        addons: [fakeAddon],
      }));
      expect(state.byAddonSlug).toEqual({
        'addon-slug': [createInternalAddon(fakeAddon)],
      });
    });

    it('always ensures the page size is consistent', () => {
      const slug = 'addon-slug';
      const state = reducer(undefined, loadAddonsByAuthors({
        slug,
        // This is the case where there are more add-ons loaded than needed.
        addons: Array(ADDONS_BY_AUTHORS_PAGE_SIZE + 2).fill(fakeAddon),
      }));
      expect(state.byAddonSlug[slug])
        .toHaveLength(ADDONS_BY_AUTHORS_PAGE_SIZE);
    });

    it('resets the loaded add-ons', () => {
      const slug = 'addon-slug';

      const previousState = reducer(undefined, loadAddonsByAuthors({
        addons: [fakeAddon],
        slug,
      }));
      expect(previousState.byAddonSlug)
        .toEqual({ 'addon-slug': [createInternalAddon(fakeAddon)] });

      const state = reducer(previousState, fetchAddonsByAuthors({
        authors: ['author1'],
        addonType: ADDON_TYPE_THEME,
        errorHandlerId: 'error-handler-id',
        slug,
      }));
      expect(state.byAddonSlug)
        .toEqual({ 'addon-slug': undefined });
    });
  });

  describe('fetchAddonsByAuthors()', () => {
    const getParams = () => {
      return {
        authors: ['user1', 'user2'],
        addonType: ADDON_TYPE_THEME,
        errorHandlerId: 'error-handler-id',
        slug: 'addon-slug',
      };
    };

    it('requires an error id', () => {
      const params = getParams();
      delete params.errorHandlerId;
      expect(() => {
        fetchAddonsByAuthors(params);
      }).toThrow(/An errorHandlerId is required/);
    });

    it('requires a slug', () => {
      const params = getParams();
      delete params.slug;
      expect(() => {
        fetchAddonsByAuthors(params);
      }).toThrow(/An add-on slug is required/);
    });

    it('requires an add-on type', () => {
      const params = getParams();
      delete params.addonType;
      expect(() => {
        fetchAddonsByAuthors(params);
      }).toThrow(/An add-on type is required/);
    });

    it('requires some authors', () => {
      const params = getParams();
      delete params.authors;
      expect(() => {
        fetchAddonsByAuthors(params);
      }).toThrow(/Authors are required/);
    });

    it('requires an array of authors', () => {
      const params = getParams();
      params.authors = 'invalid-type';
      expect(() => {
        fetchAddonsByAuthors(params);
      }).toThrow(/The authors parameter must be an array/);
    });
  });

  describe('loadAddonsByAuthors()', () => {
    const getParams = () => {
      return {
        addons: [fakeAddon],
        slug: 'addon-slug',
      };
    };

    it('requires an add-on slug', () => {
      const params = getParams();
      delete params.slug;
      expect(() => {
        loadAddonsByAuthors(params);
      }).toThrow(/An add-on slug is required/);
    });

    it('requires an array of add-ons', () => {
      const params = getParams();
      delete params.addons;
      expect(() => {
        loadAddonsByAuthors(params);
      }).toThrow(/A set of add-ons is required/);
    });
  });
});
