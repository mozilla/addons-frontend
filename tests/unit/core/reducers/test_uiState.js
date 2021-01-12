import reducer, { setUIState } from 'amo/reducers/uiState';

describe(__filename, () => {
  describe('reducer', () => {
    it('lets you set UI state', () => {
      const id = 'component-instance-id';

      const state = reducer(
        undefined,
        setUIState({
          id,
          change: { color: 'red' },
        }),
      );

      expect(state[id].color).toEqual('red');
    });

    it('preserves existing component state', () => {
      const id = 'component-instance-id';

      let state;
      state = reducer(
        state,
        setUIState({
          id,
          change: { color: 'red' },
        }),
      );
      state = reducer(
        state,
        setUIState({
          id,
          change: { mood: 'blue' },
        }),
      );

      expect(state[id].color).toEqual('red');
      expect(state[id].mood).toEqual('blue');
    });

    it('changes existing component state', () => {
      const id = 'component-instance-id';

      let state;
      state = reducer(
        state,
        setUIState({
          id,
          change: { color: 'red' },
        }),
      );
      state = reducer(
        state,
        setUIState({
          id,
          change: { color: 'magenta' },
        }),
      );

      expect(state[id].color).toEqual('magenta');
    });

    it('preserves other state for other components', () => {
      const id1 = 'component-instance1';
      const id2 = 'component-instance2';

      let state;
      state = reducer(
        state,
        setUIState({
          id: id1,
          change: { color: 'red' },
        }),
      );
      state = reducer(
        state,
        setUIState({
          id: id2,
          change: { size: 'large' },
        }),
      );

      expect(state[id1].color).toEqual('red');
      expect(state[id2].size).toEqual('large');
    });

    it('ignores unrelated actions', () => {
      const id = 'component-instance-id';

      let state;
      state = reducer(
        state,
        setUIState({
          id,
          change: { color: 'red' },
        }),
      );
      state = reducer(state, { type: 'ANOTHER_ACTION', payload: {} });

      expect(state[id].color).toEqual('red');
    });
  });
});
