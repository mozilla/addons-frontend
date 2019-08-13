import reducer, {
  abortFetchHeroShelves,
  createInternalHeroShelves,
  fetchHeroShelves,
  getHeroShelves,
  initialState,
  loadHeroShelves,
} from 'amo/reducers/hero';
import { createStubErrorHandler, fakeHeroShelves } from 'tests/unit/helpers';

describe(__filename, () => {
  it('initializes properly', () => {
    const state = reducer(undefined, {});
    expect(state).toEqual(initialState);
  });

  it('ignores unrelated actions', () => {
    const state = reducer(initialState, { type: 'UNRELATED_ACTION' });
    expect(state).toEqual(initialState);
  });

  it('sets the loading flag when fetching hero shelves', () => {
    const state = reducer(
      undefined,
      fetchHeroShelves({ errorHandlerId: createStubErrorHandler().id }),
    );

    expect(state.loading).toEqual(true);
    expect(state.heroShelves).toEqual(null);
  });

  it('loads hero shelves', () => {
    const heroShelves = fakeHeroShelves;
    const state = reducer(undefined, loadHeroShelves({ heroShelves }));

    const loadedHeroShelves = getHeroShelves({ state });

    expect(loadedHeroShelves).toEqual(createInternalHeroShelves(heroShelves));
  });

  it('resets the loading flag when fetching is aborted', () => {
    const state = reducer(
      undefined,
      fetchHeroShelves({ errorHandlerId: createStubErrorHandler().id }),
    );

    expect(state.loading).toEqual(true);

    const newState = reducer(state, abortFetchHeroShelves());
    expect(newState.loading).toEqual(false);
  });

  describe('getHeroShelves', () => {
    it('returns undefined if no hero shelves have been loaded', () => {
      const state = reducer(undefined, {});

      expect(getHeroShelves({ state })).toEqual(undefined);
    });

    it('returns null if fetching has been aborted', () => {
      const state = reducer(undefined, abortFetchHeroShelves());

      expect(getHeroShelves({ state })).toEqual(null);
    });
  });
});
