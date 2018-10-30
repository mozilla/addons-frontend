import guideReducer, { initialState } from 'amo/reducers/guides';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes to its default state', () => {
      const state = guideReducer(undefined, {});
      expect(state).toEqual(initialState);
    });
  });
});
