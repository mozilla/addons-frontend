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

    it('stores add-on GUIDs by slug', () => {
      const slug1 = 'some-slug-1';
      const guids1 = ['guid-11', 'guid-12'];

      const slug2 = 'some-slug-2';
      const guids2 = ['guid-21', 'guid-22'];

      let guidesState = guidesReducer(
        undefined,
        fetchGuidesAddons({ slug: slug1, guids: guids1, errorHandlerId: 'id' }),
      );
      guidesState = guidesReducer(
        guidesState,
        fetchGuidesAddons({ slug: slug2, guids: guids2, errorHandlerId: 'id' }),
      );

      expect(getGUIDsBySlug({ guidesState, slug: slug1 })).toEqual(guids1);
      expect(getGUIDsBySlug({ guidesState, slug: slug2 })).toEqual(guids2);
    });
  });

  describe('getGUIDsBySlug', () => {
    it('returns an empty array when there is no corresponding slug', () => {
      const slug = 'some-slug';
      const guids = getGUIDsBySlug({ guidesState: initialState, slug });

      expect(guids).toEqual([]);
    });
  });
});
