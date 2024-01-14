/* @flow */
import invariant from 'invariant';

import { SET_LANG } from 'amo/reducers/api';
import { createInternalAddons } from 'amo/reducers/collections';
import type { ExternalCollectionAddons } from 'amo/reducers/collections';
import type { CollectionAddonType } from 'amo/types/addons';

export const ABORT_FETCH_SUGGESTIONS: 'ABORT_FETCH_SUGGESTIONS' =
  'ABORT_FETCH_SUGGESTIONS';
export const FETCH_SUGGESTIONS: 'FETCH_SUGGESTIONS' = 'FETCH_SUGGESTIONS';
export const LOAD_SUGGESTIONS: 'LOAD_SUGGESTIONS' = 'LOAD_SUGGESTIONS';

export type Suggestions = Array<CollectionAddonType> | null;

export type SuggestionsState = {|
  forCollection: {
    [collection: string]: Suggestions,
  },

  lang: string,
  loading: boolean,
|};

export const initialState: SuggestionsState = {
  forCollection: {},
  // We default lang to '' to avoid having to add a lot of invariants to our
  // code, and protect against a lang of '' in selectLocalizedContent.
  lang: '',
  loading: false,
};

export type AbortFetchSuggestionsParams = {|
  collection: string,
|};

type AbortFetchSuggestionsAction = {|
  type: typeof ABORT_FETCH_SUGGESTIONS,
  payload: AbortFetchSuggestionsParams,
|};

export const abortFetchSuggestions = ({
  collection,
}: AbortFetchSuggestionsParams): AbortFetchSuggestionsAction => {
  invariant(collection, 'collection is required');
  return {
    type: ABORT_FETCH_SUGGESTIONS,
    payload: { collection },
  };
};

type FetchSuggestionsParams = {|
  errorHandlerId: string,
  collection: string,
|};

export type FetchSuggestionsAction = {|
  type: typeof FETCH_SUGGESTIONS,
  payload: FetchSuggestionsParams,
|};

export const fetchSuggestions = ({
  errorHandlerId,
  collection,
}: FetchSuggestionsParams): FetchSuggestionsAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(collection, 'collection is required');

  return {
    type: FETCH_SUGGESTIONS,
    payload: { errorHandlerId, collection },
  };
};

export type LoadSuggestionsParams = {|
  addons: ExternalCollectionAddons,
  collection: string,
|};

type LoadSuggestionsAction = {|
  type: typeof LOAD_SUGGESTIONS,
  payload: LoadSuggestionsParams,
|};

export const loadSuggestions = ({
  addons,
  collection,
}: LoadSuggestionsParams): LoadSuggestionsAction => {
  invariant(addons, 'addons is required');
  invariant(collection, 'collection is required');

  return {
    type: LOAD_SUGGESTIONS,
    payload: { addons, collection },
  };
};

type GetSuggestionsByCollectionParams = {|
  collection: string,
  state: SuggestionsState,
|};

export const getSuggestionsByCollection = ({
  collection,
  state,
}: GetSuggestionsByCollectionParams): Suggestions | null => {
  invariant(collection, 'collection is required');
  invariant(state, 'state is required');

  return state.forCollection[collection] || null;
};

type Action =
  | AbortFetchSuggestionsAction
  | FetchSuggestionsAction
  | LoadSuggestionsAction;

const reducer = (
  // eslint-disable-next-line default-param-last
  state: SuggestionsState = initialState,
  action: Action,
): SuggestionsState => {
  switch (action.type) {
    case SET_LANG:
      return {
        ...state,
        lang: action.payload.lang,
      };
    case ABORT_FETCH_SUGGESTIONS:
      return {
        ...state,
        forCollection: {
          ...state.forCollection,
          [action.payload.collection]: null,
        },
        loading: false,
      };

    case FETCH_SUGGESTIONS:
      return {
        ...state,
        forCollection: {
          ...state.forCollection,
          [action.payload.collection]: null,
        },
        loading: true,
      };

    case LOAD_SUGGESTIONS: {
      const { addons, collection } = action.payload;
      return {
        ...state,
        forCollection: {
          ...state.forCollection,
          [collection]: createInternalAddons(addons, state.lang),
        },
        loading: false,
      };
    }

    default:
      return state;
  }
};

export default reducer;
