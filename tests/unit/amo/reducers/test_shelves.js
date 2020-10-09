import reducer, {
  abortFetchSponsored,
  fetchSponsored,
  getSponsoredShelf,
  initialState,
  loadSponsored,
} from 'amo/reducers/shelves';
import { createInternalAddon } from 'core/reducers/addons';
import { createStubErrorHandler, fakesponsoredShelf } from 'tests/unit/helpers';

describe(__filename, () => {
  it('initializes properly', () => {
    const state = reducer(undefined, {});
    expect(state).toEqual(initialState);
  });

  it('ignores unrelated actions', () => {
    const state = reducer(initialState, { type: 'UNRELATED_ACTION' });
    expect(state).toEqual(initialState);
  });

  it('sets the loading flag when fetching the sponsored shelf', () => {
    const state = reducer(
      undefined,
      fetchSponsored({ errorHandlerId: createStubErrorHandler().id }),
    );

    expect(state.isLoading).toEqual(true);
    expect(state.sponsored).toEqual(undefined);
  });

  it('loads the sponsored shelf', () => {
    const shelfData = fakesponsoredShelf;
    const state = reducer(
      undefined,
      loadSponsored({
        shelfData,
      }),
    );

    const expectedAddons = fakesponsoredShelf.results.map((addon) =>
      createInternalAddon(addon),
    );

    // This also serves as a test for getSponsoredShelf for a loaded shelf.
    const loadedSponsored = getSponsoredShelf({ shelves: state });

    expect(loadedSponsored).toEqual({
      addons: expectedAddons,
      impressionData: shelfData.impression_data,
      impressionURL: shelfData.impression_url,
    });
    expect(state.isLoading).toEqual(false);
  });

  it('resets the loading flag when fetching is aborted', () => {
    const state = reducer(
      undefined,
      fetchSponsored({ errorHandlerId: createStubErrorHandler().id }),
    );
    expect(state.isLoading).toEqual(true);

    const newState = reducer(state, abortFetchSponsored());
    expect(newState.isLoading).toEqual(false);
  });

  describe('getSponsoredShelf', () => {
    it('returns undefined if shelf has not been fetched', () => {
      expect(getSponsoredShelf({ shelves: initialState })).toEqual(undefined);
    });

    it('returns null if fetching was aborted', () => {
      const state = reducer(
        undefined,
        fetchSponsored({ errorHandlerId: createStubErrorHandler().id }),
      );
      const newState = reducer(state, abortFetchSponsored());

      expect(getSponsoredShelf({ shelves: newState })).toEqual(null);
    });
  });
});
