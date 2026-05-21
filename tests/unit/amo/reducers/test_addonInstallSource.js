import reducer, {
  setAddonInstallSource,
  clearAddonInstallSource,
  initialState,
} from 'amo/reducers/addonInstallSource';

describe(__filename, () => {
  describe('reducer', () => {
    it('returns the initial state by default', () => {
      // $FlowIgnore: passing an invalid action to test default path
      expect(reducer(undefined, { type: '@@INIT' })).toEqual(initialState);
    });

    it('sets the addon install source', () => {
      const state = reducer(
        undefined,
        setAddonInstallSource('homepage-primary-hero'),
      );

      expect(state.installSource).toEqual('homepage-primary-hero');
    });

    it('clears the addon install source', () => {
      const stateWithSource = { installSource: 'some-source' };
      const state = reducer(stateWithSource, clearAddonInstallSource());

      expect(state.installSource).toBeNull();
    });

    it('ignores unrelated actions', () => {
      const stateWithSource = { installSource: 'some-source' };
      // $FlowIgnore: passing an invalid action to test default path
      const state = reducer(stateWithSource, { type: 'SOME_OTHER_ACTION' });

      expect(state).toEqual(stateWithSource);
    });
  });
});
