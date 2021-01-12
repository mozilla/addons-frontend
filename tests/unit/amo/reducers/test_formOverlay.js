import reducer, {
  beginFormOverlaySubmit,
  closeFormOverlay,
  finishFormOverlaySubmit,
  openFormOverlay,
  initialState,
} from 'amo/reducers/formOverlay';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = reducer(undefined, {});
      expect(state).toEqual(initialState);
    });
  });

  describe('openFormOverlay', () => {
    it('requires an ID', () => {
      expect(() => openFormOverlay(undefined)).toThrow(
        /id parameter is required/,
      );
    });

    it('changes open state', () => {
      const id = 'some-form-overlay';
      const state = reducer(initialState, openFormOverlay(id));

      expect(state[id].open).toEqual(true);
    });
  });

  describe('closeFormOverlay', () => {
    it('requires an ID', () => {
      expect(() => closeFormOverlay(undefined)).toThrow(
        /id parameter is required/,
      );
    });

    it('changes open state', () => {
      const id = 'some-form-overlay';
      const state = reducer(initialState, closeFormOverlay(id));

      expect(state[id].open).toEqual(false);
    });
  });

  describe('beginFormOverlaySubmit', () => {
    it('requires an ID', () => {
      expect(() => beginFormOverlaySubmit(undefined)).toThrow(
        /id parameter is required/,
      );
    });

    it('changes submit state', () => {
      const id = 'some-form-overlay';
      const state = reducer(initialState, beginFormOverlaySubmit(id));

      expect(state[id].submitting).toEqual(true);
    });
  });

  describe('finishFormOverlaySubmit', () => {
    it('requires an ID', () => {
      expect(() => finishFormOverlaySubmit(undefined)).toThrow(
        /id parameter is required/,
      );
    });

    it('changes submit state', () => {
      const id = 'some-form-overlay';
      const state = reducer(initialState, finishFormOverlaySubmit(id));

      expect(state[id].submitting).toEqual(false);
    });
  });
});
