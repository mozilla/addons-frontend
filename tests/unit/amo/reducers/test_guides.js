import guidesReducer, {
  fetchGuidesAddons,
  getGUIDsBySlug,
  initialState,
} from 'amo/reducers/guides';
import { loadAddonResults } from 'core/reducers/addons';
import { fakeAddon } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes to its default state', () => {
      const state = guidesReducer(undefined, {});
      expect(state).toEqual(initialState);
    });

    it('updates the loading flag status', () => {
      const state = guidesReducer(
        undefined,
        fetchGuidesAddons({
          slug: 'some-slug',
          guids: 'test,test2',
          errorHandlerId: 'test',
        }),
      );

      expect(state.loading).toEqual(true);

      const newState = guidesReducer(
        undefined,
        loadAddonResults({ addons: [fakeAddon] }),
      );

      expect(newState.loading).toEqual(false);
    });

    it('stores the add-on GUIDs by slug', () => {
      const slug = 'some-slug';
      const guids = ['test', 'test2'];
      const state = guidesReducer(
        undefined,
        fetchGuidesAddons({ slug, guids, errorHandlerId: 'test' }),
      );

      expect(state.bySlug).toEqual({
        [slug]: guids,
      });
    });
  });

  describe('getGUIDsBySlug', () => {
    it('returns an empty array when there is no corresponding slug', () => {
      const slug = 'some-slug';
      const guids = getGUIDsBySlug({ guidesState: initialState, slug });

      expect(guids).toEqual([]);
    });

    it('returns the GUIDs for a given slug', () => {
      const slug = 'some-slug';
      const guids = ['test', 'test2'];
      const guidesState = guidesReducer(
        undefined,
        fetchGuidesAddons({ slug, guids, errorHandlerId: 'test' }),
      );

      expect(getGUIDsBySlug({ guidesState, slug })).toEqual(guids);
    });
  });
});
