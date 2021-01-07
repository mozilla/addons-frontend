/* @flow */
import invariant from 'invariant';

import type { UrlWithOutgoing } from 'core/types/api';

export const FETCH_BLOCK: 'FETCH_BLOCK' = 'FETCH_BLOCK';
export const ABORT_FETCH_BLOCK: 'ABORT_FETCH_BLOCK' = 'ABORT_FETCH_BLOCK';
export const LOAD_BLOCK: 'LOAD_BLOCK' = 'LOAD_BLOCK';

export type ExternalBlockType = {|
  addon_name: string | null,
  created: string,
  guid: string,
  id: number,
  max_version: string,
  min_version: string,
  modified: string,
  reason: string | null,
  url: UrlWithOutgoing | null,
|};

export type BlockType = {|
  ...ExternalBlockType,
|};

export type BlocksState = {|
  blocks: { [guid: string]: BlockType },
|};

export const initialState: BlocksState = {
  blocks: {},
};

type FetchBlockParams = {|
  errorHandlerId: string,
  guid: string,
|};

export type FetchBlockAction = {|
  type: typeof FETCH_BLOCK,
  payload: FetchBlockParams,
|};

export const fetchBlock = ({
  errorHandlerId,
  guid,
}: FetchBlockParams): FetchBlockAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(guid, 'guid is required');

  return {
    type: FETCH_BLOCK,
    payload: { errorHandlerId, guid },
  };
};

type AbortFetchBlockParams = {|
  guid: string,
|};

export type AbortFetchBlockAction = {|
  type: typeof ABORT_FETCH_BLOCK,
  payload: AbortFetchBlockParams,
|};

export const abortFetchBlock = ({
  guid,
}: AbortFetchBlockParams): AbortFetchBlockAction => {
  return {
    type: ABORT_FETCH_BLOCK,
    payload: { guid },
  };
};

type LoadBlockParams = {|
  block: ExternalBlockType,
|};

export type LoadBlockAction = {|
  type: typeof LOAD_BLOCK,
  payload: LoadBlockParams,
|};

export const loadBlock = ({ block }: LoadBlockParams): LoadBlockAction => {
  invariant(block, 'block is required');

  return {
    type: LOAD_BLOCK,
    payload: { block },
  };
};

type Action = FetchBlockAction | AbortFetchBlockAction | LoadBlockAction;

const reducer = (
  state: BlocksState = initialState,
  action: Action,
): BlocksState => {
  switch (action.type) {
    case ABORT_FETCH_BLOCK:
      return {
        ...state,
        blocks: {
          [action.payload.guid]: null,
        },
      };

    case LOAD_BLOCK: {
      const { block } = action.payload;

      return {
        ...state,
        blocks: {
          ...state.blocks,
          [block.guid]: block,
        },
      };
    }

    default:
      return state;
  }
};

export default reducer;
