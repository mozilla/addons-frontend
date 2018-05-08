import reducer, {
  abortFetchRecommendations,
  fetchRecommendations,
  getRecommendationsByGuid,
  initialState,
  loadRecommendations,
} from 'amo/reducers/recommendations';
import { createInternalAddon } from 'core/reducers/addons';
import { createStubErrorHandler } from 'tests/unit/helpers';
import { fakeAddon } from 'tests/unit/amo/helpers';


describe(__filename, () => {
  it('initializes properly', () => {
    const state = reducer(undefined, {});
    expect(state).toEqual(initialState);
  });

  it('ignores unrelated actions', () => {
    const state = reducer(initialState, { type: 'UNRELATED_ACTION' });
    expect(state).toEqual(initialState);
  });

  it('sets the loading flag when fetching recommendations', () => {
    const guid = 'some-guid';
    const state = reducer(undefined, fetchRecommendations({
      errorHandlerId: createStubErrorHandler().id,
      guid,
      recommended: true,
    }));

    expect(state.byGuid[guid].loading).toEqual(true);
    expect(state.byGuid[guid].addons).toEqual(null);
  });

  it('loads recommendations', () => {
    const addons = [fakeAddon, fakeAddon];
    const fallbackReason = 'timeout';
    const guid = 'some-guid';
    const outcome = 'recommended_fallback';
    const state = reducer(undefined, loadRecommendations({
      addons,
      fallbackReason,
      guid,
      outcome,
    }));

    const expectedAddons = addons.map((addon) => createInternalAddon(addon));

    const loadedRecommendations = getRecommendationsByGuid({ guid, state });

    expect(loadedRecommendations).toEqual({
      addons: expectedAddons,
      fallbackReason,
      loading: false,
      outcome,
    });
  });

  it('resets the loading flag when fetching is aborted', () => {
    const guid = 'some-guid';
    const state = reducer(undefined, fetchRecommendations({
      errorHandlerId: createStubErrorHandler().id,
      guid,
      recommended: true,
    }));

    expect(state.byGuid[guid].loading).toEqual(true);

    const newState = reducer(state, abortFetchRecommendations({ guid }));
    expect(newState.byGuid[guid].loading).toEqual(false);
  });

  describe('getRecommendationsByGuid', () => {
    it('returns null if no recommendations exist for the guid', () => {
      const state = reducer(undefined, {});
      const guid = 'a-non-existent-guid';

      expect(getRecommendationsByGuid({ guid, state })).toEqual(null);
    });
  });
});
