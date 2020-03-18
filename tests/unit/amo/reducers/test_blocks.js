import blocksReducer, {
  abortFetchBlock,
  initialState,
  loadBlock,
} from 'amo/reducers/blocks';
import { createFakeBlockResult } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = blocksReducer(undefined, {});
      expect(state).toEqual(initialState);
    });

    it('ignores unrelated actions', () => {
      const state = blocksReducer(initialState, { type: 'UNRELATED_ACTION' });
      expect(state).toEqual(initialState);
    });

    it('sets a block to null when fetchBlock is aborted', () => {
      const guid = 'some-guid';
      const state = blocksReducer(undefined, {});
      expect(state.blocks).toEqual({});

      const newState = blocksReducer(state, abortFetchBlock({ guid }));
      expect(newState.blocks).toEqual({ [guid]: null });
    });

    it('stores a block in its state', () => {
      const guid = 'some-guid';
      const block = createFakeBlockResult({ guid });
      const state = blocksReducer(undefined, {});

      const newState = blocksReducer(state, loadBlock({ block }));
      expect(newState.blocks[guid]).toEqual(block);
    });

    it('preserves existing blocks when loading new blocks', () => {
      const guid1 = 'some-guid-1';
      const guid2 = 'some-guid-2';
      const block1 = createFakeBlockResult({ guid: guid1 });
      const block2 = createFakeBlockResult({ guid: guid2 });
      const state = blocksReducer(undefined, {});

      let newState = blocksReducer(state, loadBlock({ block: block1 }));
      newState = blocksReducer(newState, loadBlock({ block: block2 }));
      expect(Object.keys(newState.blocks)).toEqual([guid1, guid2]);
    });
  });
});
