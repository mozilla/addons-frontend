import reducer, {
  clearExperimentVariant,
  initialState,
  storeExperimentVariant,
} from 'amo/reducers/experiments';

describe(__filename, () => {
  describe('reducer', () => {
    const id = 'some_experiment_id';
    const variant = 'some-variant';

    it('initializes properly', () => {
      const state = reducer(undefined, { type: 'NONE' });

      expect(state).toEqual(initialState);
    });

    it('stores an experiment variant', () => {
      const state = reducer(undefined, storeExperimentVariant({ id, variant }));

      expect(state[id]).toEqual(variant);
    });

    it('can store variants for multiple experiments', () => {
      const anotherId = 'some_other_experiment_id';
      const anotherVariant = 'another-variant';

      let state = reducer(undefined, storeExperimentVariant({ id, variant }));
      state = reducer(
        state,
        storeExperimentVariant({ id: anotherId, variant: anotherVariant }),
      );

      expect(state[id]).toEqual(variant);
      expect(state[anotherId]).toEqual(anotherVariant);
    });

    it('can clear an experiment variant', () => {
      let state = reducer(undefined, storeExperimentVariant({ id, variant }));

      expect(state[id]).toEqual(variant);

      state = reducer(state, clearExperimentVariant({ id }));

      expect(state[id]).toEqual(undefined);
    });

    it('only clears the specificed experiment variant', () => {
      const anotherId = 'some_other_experiment_id';
      const anotherVariant = 'another-variant';

      let state = reducer(undefined, storeExperimentVariant({ id, variant }));
      state = reducer(
        state,
        storeExperimentVariant({ id: anotherId, variant: anotherVariant }),
      );

      state = reducer(state, clearExperimentVariant({ id }));

      expect(state[id]).toEqual(undefined);
      expect(state[anotherId]).toEqual(anotherVariant);
    });
  });
});
