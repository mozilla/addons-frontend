/* @flow */
import invariant from 'invariant';

import { SET_LANG } from 'amo/reducers/api';
import { selectLocalizedContent } from 'amo/reducers/utils';
import type { LocalizedString, UrlWithOutgoing } from 'amo/types/api';

export const FETCH_BLOCK: 'FETCH_BLOCK' = 'FETCH_BLOCK';
export const ABORT_FETCH_BLOCK: 'ABORT_FETCH_BLOCK' = 'ABORT_FETCH_BLOCK';
export const LOAD_BLOCK: 'LOAD_BLOCK' = 'LOAD_BLOCK';

export type ExternalBlockType = {|
  addon_name: LocalizedString | null,
  created: string,
  guid: string,
  id: number,
  soft_blocked: [string],
  blocked: [string],
  is_all_versions?: boolean,
  modified: string,
  reason: string | null,
  url: UrlWithOutgoing | null,
|};

export type BlockType = {|
  ...ExternalBlockType,
  name: string | null,
|};

export type BlocksState = {|
  blocks: { [guid: string]: BlockType },
  lang: string,
|};

export const initialState: BlocksState = {
  blocks: {},
  // We default lang to '' to avoid having to add a lot of invariants to our
  // code, and protect against a lang of '' in selectLocalizedContent.
  lang: '',
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

export const createInternalBlock = (
  block: ExternalBlockType,
  lang: string,
): BlockType => {
  return {
    ...block,
    name: selectLocalizedContent(block.addon_name, lang),
  };
};

export const isSoftBlocked = (
  block?: BlockType | null,
  versionId?: string,
): boolean => {
  return (
    Boolean(block?.soft_blocked.length) &&
    (block?.soft_blocked.includes(versionId) || !block?.blocked.length)
  );
};

type Action = FetchBlockAction | AbortFetchBlockAction | LoadBlockAction;

const reducer = (
  // eslint-disable-next-line default-param-last
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
          [block.guid]: createInternalBlock(block, state.lang),
        },
      };
    }

    case SET_LANG:
      return {
        ...state,
        lang: action.payload.lang,
      };

    default:
      return state;
  }
};

export default reducer;
