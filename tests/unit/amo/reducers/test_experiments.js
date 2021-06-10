import reducer, {
  initialState,
  storeExperimentVariant,
} from 'amo/reducers/experiments';
import { fakeStoredVariant } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = reducer(undefined, { type: 'NONE' });

      expect(state).toEqual(initialState);
    });

    it('stores an experiment variant', () => {
      const storedVariant = fakeStoredVariant;

      const state = reducer(
        undefined,
        storeExperimentVariant({ storedVariant }),
      );

      expect(state.storedVariant).toEqual(storedVariant);
    });

    it('can clear an experiment variant', () => {
      const storedVariant = fakeStoredVariant;

      let state = reducer(undefined, storeExperimentVariant({ storedVariant }));

      expect(state.storedVariant).toEqual(storedVariant);

      state = reducer(state, storeExperimentVariant({ storedVariant: null }));

      expect(state.storedVariant).toEqual(null);
    });
  });
});
