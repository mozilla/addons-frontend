import reducer, { initialState, loadSiteStatus, loadedPageIsAnonymous } from 'amo/reducers/site';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = reducer(undefined, {
        type: 'NONE',
      });
      expect(state).toEqual(initialState);
    });
    it('stores the site status data', () => {
      const readOnly = true;
      const notice = 'some notice';
      const state = reducer(undefined, loadSiteStatus({
        readOnly,
        notice,
      }));
      expect(state).toEqual(expect.objectContaining({
        readOnly,
        notice,
      }));
    });
    it('marks the loaded page as anonymous', () => {
      const state = reducer(undefined, loadedPageIsAnonymous());
      expect(state).toEqual(expect.objectContaining({
        loadedPageIsAnonymous: true,
      }));
    });
  });
});