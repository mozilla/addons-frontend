import collectionAbuseReportsReducer, {
  abortCollectionAbuseReport,
  initialState,
  loadCollectionAbuseReport,
  sendCollectionAbuseReport,
} from 'amo/reducers/collectionAbuseReports';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = collectionAbuseReportsReducer(initialState, {
        type: 'UNRELATED_ACTION',
      });
      expect(state).toEqual(initialState);
    });
  });

  describe('abortCollectionAbuseReport', () => {
    it('requires a collection ID', () => {
      expect(() => {
        abortCollectionAbuseReport({});
      }).toThrow('collectionId is required');
    });

    it('resets a collection report', () => {
      const collectionId = 123;

      let state = collectionAbuseReportsReducer(
        undefined,
        sendCollectionAbuseReport({
          collectionId,
          errorHandlerId: 'some-error-handler-id',
        }),
      );
      expect(state.byCollectionId[collectionId]).toMatchObject({
        isSubmitting: true,
      });

      state = collectionAbuseReportsReducer(
        state,
        abortCollectionAbuseReport({ collectionId }),
      );
      expect(state.byCollectionId[collectionId]).toEqual({
        hasSubmitted: false,
        isSubmitting: false,
      });
    });

    it('does not change the unrelated reports', () => {
      const collectionId = 157;
      const errorHandlerId = 'some-error-handler';
      let state = collectionAbuseReportsReducer(
        undefined,
        sendCollectionAbuseReport({ collectionId, errorHandlerId }),
      );
      state = collectionAbuseReportsReducer(
        state,
        sendCollectionAbuseReport({ collectionId: 246, errorHandlerId }),
      );

      state = collectionAbuseReportsReducer(
        state,
        abortCollectionAbuseReport({ collectionId }),
      );

      expect(state.byCollectionId).toMatchObject({
        157: {
          isSubmitting: false,
          hasSubmitted: false,
        },
        246: {
          isSubmitting: true,
          hasSubmitted: false,
        },
      });
    });
  });

  describe('loadCollectionAbuseReport', () => {
    it('requires a collection ID', () => {
      expect(() => {
        loadCollectionAbuseReport({});
      }).toThrow('collectionId is required');
    });

    it('marks a collection report as submitted', () => {
      const collectionId = 123;

      const state = collectionAbuseReportsReducer(
        undefined,
        loadCollectionAbuseReport({
          collectionId,
        }),
      );

      expect(state.byCollectionId[collectionId]).toEqual({
        hasSubmitted: true,
        isSubmitting: false,
      });
    });

    it('does not change the unrelated reports', () => {
      const collectionId = 157;
      const errorHandlerId = 'some-error-handler';
      let state = collectionAbuseReportsReducer(
        undefined,
        sendCollectionAbuseReport({ collectionId, errorHandlerId }),
      );
      state = collectionAbuseReportsReducer(
        state,
        sendCollectionAbuseReport({ collectionId: 246, errorHandlerId }),
      );

      state = collectionAbuseReportsReducer(
        state,
        loadCollectionAbuseReport({ collectionId }),
      );

      expect(state.byCollectionId).toMatchObject({
        157: {
          isSubmitting: false,
          hasSubmitted: true,
        },
        246: {
          isSubmitting: true,
          hasSubmitted: false,
        },
      });
    });
  });

  describe('sendCollectionAbuseReport', () => {
    it('requires a collection ID', () => {
      expect(() => {
        sendCollectionAbuseReport({ errorHandlerId: 'error-handler-id' });
      }).toThrow('collectionId is required');
    });

    it('requires an error handler ID', () => {
      expect(() => {
        sendCollectionAbuseReport({ collectionId: 123 });
      }).toThrow('errorHandlerId is required');
    });

    it('marks a collection report as being submitted', () => {
      const collectionId = 123;

      const state = collectionAbuseReportsReducer(
        undefined,
        sendCollectionAbuseReport({
          collectionId,
          errorHandlerId: 'some-error-handler-id',
        }),
      );

      expect(state.byCollectionId[collectionId]).toEqual({
        hasSubmitted: false,
        isSubmitting: true,
      });
    });

    it('can load multiple reports', () => {
      const errorHandlerId = 'some-error-handler-id';

      let state = collectionAbuseReportsReducer(
        undefined,
        sendCollectionAbuseReport({ collectionId: 1, errorHandlerId }),
      );
      state = collectionAbuseReportsReducer(
        state,
        sendCollectionAbuseReport({ collectionId: 246, errorHandlerId }),
      );

      expect(state.byCollectionId).toMatchObject({
        1: expect.any(Object),
        246: expect.any(Object),
      });
    });
  });
});
