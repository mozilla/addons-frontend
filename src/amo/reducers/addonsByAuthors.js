/* @flow */
import invariant from 'invariant';

import { createInternalAddon } from 'core/reducers/addons';
import type { AddonType, ExternalAddonType } from 'core/types/addons';


type State = {
  byAddonSlug: { [string]: AddonType },
};

export const initialState: State = {
  byAddonSlug: {},
};

export const ADDONS_BY_AUTHORS_PAGE_SIZE = 6;

// For further information about this notation, see:
// https://github.com/mozilla/addons-frontend/pull/3027#discussion_r137661289
export const FETCH_ADDONS_BY_AUTHORS: 'FETCH_ADDONS_BY_AUTHORS'
  = 'FETCH_ADDONS_BY_AUTHORS';
export const LOAD_ADDONS_BY_AUTHORS: 'LOAD_ADDONS_BY_AUTHORS'
  = 'LOAD_ADDONS_BY_AUTHORS';

type FetchAddonsByAuthorsParams = {|
  addonType: string,
  authors: Array<string>,
  errorHandlerId: string,
  excludeAddonBySlug?: string,
|};

type FetchAddonsByAuthorsAction = {|
  type: typeof FETCH_ADDONS_BY_AUTHORS,
  payload: FetchAddonsByAuthorsParams,
|};

export const fetchAddonsByAuthors = (
  { addonType, authors, errorHandlerId, excludeAddonBySlug }: FetchAddonsByAuthorsParams
): FetchAddonsByAuthorsAction => {
  invariant(errorHandlerId, 'An errorHandlerId is required');
  invariant(addonType, 'An add-on type is required.');
  invariant(authors, 'Authors are required.');
  invariant(Array.isArray(authors), 'The authors parameter must be an array.');

  return {
    type: FETCH_ADDONS_BY_AUTHORS,
    payload: {
      addonType,
      authors,
      errorHandlerId,
      excludeAddonBySlug,
    },
  };
};

type LoadAddonsByAuthorsParams = {|
  addons: Array<ExternalAddonType>,
  excludeAddonBySlug?: string,
|};

type LoadAddonsByAuthorsAction = {|
  type: typeof LOAD_ADDONS_BY_AUTHORS,
  payload: LoadAddonsByAuthorsParams,
|};

export const loadAddonsByAuthors = (
  { addons, excludeAddonBySlug }: LoadAddonsByAuthorsParams
): LoadAddonsByAuthorsAction => {
  invariant(addons, 'A set of add-ons is required.');

  return {
    type: LOAD_ADDONS_BY_AUTHORS,
    payload: { addons, excludeAddonBySlug },
  };
};

type Action =
  | FetchAddonsByAuthorsAction
  | LoadAddonsByAuthorsAction;

const reducer = (
  state: State = initialState,
  action: Action
): State => {
  switch (action.type) {
    case FETCH_ADDONS_BY_AUTHORS:
      if (!action.payload.excludeAddonBySlug) {
        return state;
      }

      return {
        ...state,
        byAddonSlug: {
          ...state.byAddonSlug,
          [action.payload.excludeAddonBySlug]: undefined,
        },
      };
    case LOAD_ADDONS_BY_AUTHORS:
      if (!action.payload.excludeAddonBySlug) {
        return state;
      }

      return {
        ...state,
        byAddonSlug: {
          ...state.byAddonSlug,
          [action.payload.excludeAddonBySlug]: action.payload.addons
            .slice(0, ADDONS_BY_AUTHORS_PAGE_SIZE)
            .map((addon) => createInternalAddon(addon)),
        },
      };
    default:
      return state;
  }
};

export default reducer;
