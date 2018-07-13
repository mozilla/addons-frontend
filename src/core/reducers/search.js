/* @flow */
import invariant from 'invariant';

import { createInternalAddon } from 'core/reducers/addons';
import type {
  AddonType,
  CollectionAddonType,
  ExternalAddonType,
} from 'core/types/addons';

export const SEARCH_STARTED: 'SEARCH_STARTED' = 'SEARCH_STARTED';
export const SEARCH_LOADED: 'SEARCH_LOADED' = 'SEARCH_LOADED';

const SEARCH_ABORTED: 'SEARCH_ABORTED' = 'SEARCH_ABORTED';
const SEARCH_RESET: 'SEARCH_RESET' = 'SEARCH_RESET';

export type FiltersType = {|
  addonType?: string,
  featured?: boolean,
  operatingSystem?: string,
  page?: number,
  query?: Object,
  sort?: string,
|};

export type SearchState = {|
  count: number,
  filters: FiltersType | {},
  loading: boolean,
  pageSize: number | null,
  results: Array<AddonType | CollectionAddonType>,
|};

export const initialState: SearchState = {
  count: 0,
  filters: {},
  loading: false,
  pageSize: null,
  results: [],
};

type AbortSearchAction = {|
  type: typeof SEARCH_ABORTED,
|};

export const abortSearch = (): AbortSearchAction => {
  return { type: SEARCH_ABORTED };
};

type ResetSearchAction = {|
  type: typeof SEARCH_RESET,
|};

export const resetSearch = (): ResetSearchAction => {
  return { type: SEARCH_RESET };
};

type SearchStartParams = {|
  errorHandlerId: string,
  filters: FiltersType,
|};

type SearchStartAction = {|
  type: typeof SEARCH_STARTED,
  payload: SearchStartParams,
|};

export function searchStart({
  errorHandlerId,
  filters,
}: SearchStartParams): SearchStartAction {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(filters, 'filters are required');

  return {
    type: SEARCH_STARTED,
    payload: { errorHandlerId, filters },
  };
}

type SearchLoadParams = {|
  entities: {|
    addons: { [slug: string]: ExternalAddonType },
  |},
  result: {|
    count: number,
    page_size: number,
    results: Array<string>,
  |},
|};

type SearchLoadAction = {|
  type: typeof SEARCH_LOADED,
  payload: SearchLoadParams,
|};

export function searchLoad({
  entities,
  result,
}: SearchLoadParams): SearchLoadAction {
  invariant(entities, 'entities are required');
  invariant(result, 'result is required');

  return {
    type: SEARCH_LOADED,
    payload: { entities, result },
  };
}

type Action =
  | AbortSearchAction
  | ResetSearchAction
  | SearchStartAction
  | SearchLoadAction;

export default function search(
  state: SearchState = initialState,
  action: Action,
): SearchState {
  switch (action.type) {
    case SEARCH_STARTED: {
      const { payload } = action;

      return {
        ...state,
        count: 0,
        filters: payload.filters,
        loading: true,
        results: [],
      };
    }
    case SEARCH_LOADED: {
      const { payload } = action;

      return {
        ...state,
        count: payload.result.count,
        loading: false,
        pageSize: payload.result.page_size,
        results: payload.result.results.map((slug) =>
          createInternalAddon(payload.entities.addons[slug]),
        ),
      };
    }
    case SEARCH_ABORTED:
      return {
        ...state,
        count: 0,
        loading: false,
        results: [],
      };
    case SEARCH_RESET:
      return initialState;
    default:
      return state;
  }
}
