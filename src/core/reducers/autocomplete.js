/* @flow */
import invariant from 'invariant';

import { getAddonIconUrl } from 'core/imageUtils';

export const AUTOCOMPLETE_LOADED: 'AUTOCOMPLETE_LOADED' = 'AUTOCOMPLETE_LOADED';
export const AUTOCOMPLETE_STARTED: 'AUTOCOMPLETE_STARTED' =
  'AUTOCOMPLETE_STARTED';
export const AUTOCOMPLETE_CANCELLED: 'AUTOCOMPLETE_CANCELLED' =
  'AUTOCOMPLETE_CANCELLED';

// See: https://addons-server.readthedocs.io/en/latest/topics/api/addons.html#autocomplete
type ExternalSuggestion = {|
  icon_url: string,
  id: number,
  is_recommended: boolean,
  name: string,
  type: string,
  url: string,
|};

type Suggestion = {|
  addonId: number,
  iconUrl: string,
  isRecommended: boolean,
  name: string,
  type: string,
  url: string,
|};

export type AutocompleteState = {|
  loading: boolean,
  suggestions: Array<Suggestion>,
|};

const initialState: AutocompleteState = {
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
): Suggestion => {
  return {
    addonId: externalSuggestion.id,
    iconUrl: getAddonIconUrl(externalSuggestion),
    isRecommended: externalSuggestion.is_recommended,
    name: externalSuggestion.name,
    type: externalSuggestion.type,
    url: externalSuggestion.url,
  };
};

type Action =
  | AutocompleteCancelAction
  | AutocompleteLoadAction
  | AutocompleteStartAction;

export default function reducer(
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
        loading: true,
      };
    case AUTOCOMPLETE_LOADED: {
      const { payload } = action;

      const suggestions = payload.results
        // TODO: Remove this when `null` names are not returned. See:
        // https://github.com/mozilla/addons-server/issues/6189
        .filter((result) => result.name !== null)
        .map((result) => createInternalSuggestion(result));

      return {
        ...state,
        loading: false,
        suggestions,
      };
    }
    default:
      return state;
  }
}
