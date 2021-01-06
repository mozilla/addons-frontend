import { LOCATION_CHANGE } from 'connected-react-router';

import reducer, {
  abortFetchSponsored,
  fetchSponsored,
  getSponsoredShelf,
  initialState,
  loadSponsored,
} from 'amo/reducers/shelves';
import { setLang } from 'core/reducers/api';
import {
  createInternalAddonWithLang,
  createStubErrorHandler,
  dispatchClientMetadata,
  fakeSponsoredShelf,
  getFakeConfig,
} from 'tests/unit/helpers';

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
    const shelfData = fakeSponsoredShelf;
    let state = reducer(undefined, setLang('en-US'));
    state = reducer(
      state,
      loadSponsored({
        shelfData,
      }),
    );

    const expectedAddons = fakeSponsoredShelf.results.map((addon) =>
      createInternalAddonWithLang(addon),
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

  it('sets `resetStateOnNextChange` to `true` after a location change on the client', () => {
    const _config = getFakeConfig({ server: false });

    const state = reducer(undefined, { type: LOCATION_CHANGE }, _config);

    expect(state.resetStateOnNextChange).toEqual(true);
  });

  it('does not set `resetStateOnNextChange` to `true` after a location change on the server', () => {
    const _config = getFakeConfig({ server: true });

    const state = reducer(undefined, { type: LOCATION_CHANGE }, _config);

    expect(state.resetStateOnNextChange).toEqual(false);
  });

  it('resets the state to the initial (but preserves lang) state after two location changes on the client', () => {
    const lang = 'fr';
    const _config = getFakeConfig({ server: false });
    const { store } = dispatchClientMetadata({ lang });
    const impressionData = 'some data';
    const shelfData = {
      ...fakeSponsoredShelf,
      impression_data: impressionData,
    };

    store.dispatch(loadSponsored({ shelfData }));

    let state = store.getState().shelves;
    expect(state.sponsored.impressionData).toEqual(impressionData);

    // Perform two client-side location changes.
    state = reducer(state, { type: LOCATION_CHANGE }, _config);
    state = reducer(state, { type: LOCATION_CHANGE }, _config);

    expect(state).toEqual({ ...initialState, lang });
  });

  it('does not reset the state to the initial state after only one location change on the client', () => {
    const _config = getFakeConfig({ server: false });
    const { store } = dispatchClientMetadata();
    const impressionData = 'some data';
    const shelfData = {
      ...fakeSponsoredShelf,
      impression_data: impressionData,
    };

    store.dispatch(loadSponsored({ shelfData }));

    const firstState = store.getState().shelves;
    expect(firstState.sponsored.impressionData).toEqual(impressionData);

    const newState = reducer(firstState, { type: LOCATION_CHANGE }, _config);

    expect(newState).toEqual({
      ...firstState,
      resetStateOnNextChange: true,
    });
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
