/* @flow */
import invariant from 'invariant';

import { getAddonIconUrl } from 'amo/imageUtils';
import { SET_LANG } from 'amo/reducers/api';
import {
  makeInternalPromoted,
  selectLocalizedContent,
} from 'amo/reducers/utils';
import type { PromotedType } from 'amo/types/addons';
import type { LocalizedString } from 'amo/types/api';

export const AUTOCOMPLETE_LOADED: 'AUTOCOMPLETE_LOADED' = 'AUTOCOMPLETE_LOADED';
export const AUTOCOMPLETE_STARTED: 'AUTOCOMPLETE_STARTED' =
  'AUTOCOMPLETE_STARTED';
export const AUTOCOMPLETE_CANCELLED: 'AUTOCOMPLETE_CANCELLED' =
  'AUTOCOMPLETE_CANCELLED';

// See: https://addons-server.readthedocs.io/en/latest/topics/api/addons.html#autocomplete
export type ExternalSuggestion = {|
  icon_url: string,
  id: number,
  name: LocalizedString,
  promoted: Array<PromotedType> | PromotedType | null,
  type: string,
  url: string,
|};

export type SuggestionType = {|
  addonId: number,
  iconUrl: string,
  name: string,
  promoted: Array<PromotedType>,
  type: string,
  url: string,
|};

export type AutocompleteState = {|
  lang: string,
  loading: boolean,
  suggestions: Array<SuggestionType>,
|};

const initialState: AutocompleteState = {
  // We default lang to '' to avoid having to add a lot of invariants to our
  // code, and protect against a lang of '' in selectLocalizedContent.
  lang: '',
  loading: false,
  suggestions: [],
};

type AutocompleteStartParams = {|
  errorHandlerId: string,
  filters: {|
    query: string,
    addonType?: string,
  |},
|};

export type AutocompleteStartAction = {|
  type: typeof AUTOCOMPLETE_STARTED,
  payload: AutocompleteStartParams,
|};

export function autocompleteStart({
  errorHandlerId,
  filters,
}: AutocompleteStartParams): AutocompleteStartAction {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(filters, 'filters are required');

  return {
    type: AUTOCOMPLETE_STARTED,
    payload: { errorHandlerId, filters },
  };
}

type AutocompleteCancelAction = {|
  type: typeof AUTOCOMPLETE_CANCELLED,
|};

export function autocompleteCancel(): AutocompleteCancelAction {
  return { type: AUTOCOMPLETE_CANCELLED };
}

type AutocompleteLoadParams = {|
  results: Array<ExternalSuggestion>,
|};

type AutocompleteLoadAction = {|
  type: typeof AUTOCOMPLETE_LOADED,
  payload: AutocompleteLoadParams,
|};

export function autocompleteLoad({
  results,
}: AutocompleteLoadParams): AutocompleteLoadAction {
  invariant(results, 'results are required');

  return {
    type: AUTOCOMPLETE_LOADED,
    payload: { results },
  };
}

export const createInternalSuggestion = (
  externalSuggestion: ExternalSuggestion,
  lang: string,
): SuggestionType => {
  return {
    addonId: externalSuggestion.id,
    iconUrl: getAddonIconUrl(externalSuggestion),
    name: selectLocalizedContent(externalSuggestion.name, lang),
    promoted: makeInternalPromoted(externalSuggestion.promoted),
    type: externalSuggestion.type,
    url: externalSuggestion.url,
  };
};

type Action =
  | AutocompleteCancelAction
  | AutocompleteLoadAction
  | AutocompleteStartAction;

export default function reducer(
  // eslint-disable-next-line default-param-last
  state: AutocompleteState = initialState,
  action: Action,
): AutocompleteState {
  switch (action.type) {
    case AUTOCOMPLETE_CANCELLED:
      return {
        ...state,
        loading: false,
        suggestions: [],
      };
    case AUTOCOMPLETE_STARTED:
      return {
        ...initialState,
        lang: state.lang,
        loading: true,
      };
    case AUTOCOMPLETE_LOADED: {
      const { payload } = action;

      const suggestions = payload.results
        // TODO: Remove this when `null` names are not returned. See:
        // https://github.com/mozilla/addons-server/issues/6189
        .filter((result) => result.name !== null)
        .map((result) => createInternalSuggestion(result, state.lang));

      return {
        ...state,
        loading: false,
        suggestions,
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
}
