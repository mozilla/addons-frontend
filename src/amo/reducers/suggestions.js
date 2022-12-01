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
  byCategory: {
    [slug: string]: Suggestions,
  },
  lang: string,
  loading: boolean,
|};

export const initialState: SuggestionsState = {
  byCategory: {},
  // We default lang to '' to avoid having to add a lot of invariants to our
  // code, and protect against a lang of '' in selectLocalizedContent.
  lang: '',
  loading: false,
};

export type AbortFetchSuggestionsParams = {|
  slug: string,
|};

type AbortFetchSuggestionsAction = {|
  type: typeof ABORT_FETCH_SUGGESTIONS,
  payload: AbortFetchSuggestionsParams,
|};

export const abortFetchSuggestions = ({
  slug,
}: AbortFetchSuggestionsParams): AbortFetchSuggestionsAction => {
  invariant(slug, 'slug is required');
  return {
    type: ABORT_FETCH_SUGGESTIONS,
    payload: { slug },
  };
};

type FetchSuggestionsParams = {|
  errorHandlerId: string,
  slug: string,
|};

export type FetchSuggestionsAction = {|
  type: typeof FETCH_SUGGESTIONS,
  payload: FetchSuggestionsParams,
|};

export const fetchSuggestions = ({
  errorHandlerId,
  slug,
}: FetchSuggestionsParams): FetchSuggestionsAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(slug, 'slug is required');

  return {
    type: FETCH_SUGGESTIONS,
    payload: { errorHandlerId, slug },
  };
};

export type LoadSuggestionsParams = {|
  addons: ExternalCollectionAddons,
  slug: string,
|};

type LoadSuggestionsAction = {|
  type: typeof LOAD_SUGGESTIONS,
  payload: LoadSuggestionsParams,
|};

export const loadSuggestions = ({
  addons,
  slug,
}: LoadSuggestionsParams): LoadSuggestionsAction => {
  invariant(addons, 'addons is required');
  invariant(slug, 'slug is required');

  return {
    type: LOAD_SUGGESTIONS,
    payload: { addons, slug },
  };
};

type GetSuggestionsByCategoryParams = {|
  slug: string,
  state: SuggestionsState,
|};

export const getSuggestionsByCategory = ({
  slug,
  state,
}: GetSuggestionsByCategoryParams): Suggestions | null => {
  invariant(slug, 'slug is required');
  invariant(state, 'state is required');

  return state.byCategory[slug] || null;
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
        byCategory: {
          ...state.byCategory,
          [action.payload.slug]: null,
        },
        loading: false,
      };

    case FETCH_SUGGESTIONS:
      return {
        ...state,
        byCategory: {
          ...state.byCategory,
          [action.payload.slug]: null,
        },
        loading: true,
      };

    case LOAD_SUGGESTIONS: {
      const { addons, slug } = action.payload;
      return {
        ...state,
        byCategory: {
          ...state.byCategory,
          [slug]: createInternalAddons(addons, state.lang),
        },
        loading: false,
      };
    }

    default:
      return state;
  }
};

export default reducer;
