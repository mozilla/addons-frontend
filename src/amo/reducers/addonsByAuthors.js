/* @flow */
import deepcopy from 'deepcopy';
import invariant from 'invariant';

import { createInternalAddon } from 'core/reducers/addons';
import type { AddonType, ExternalAddonType } from 'core/types/addons';


type State = {
  // TODO: It might be nice to eventually stop storing add-ons in this
  // reducer at all and rely on the add-ons in the `addons` reducer.
  // That said, these are partial add-ons returned from the search
  // results and fetching all add-on data for each add-on might be too
  // expensive.
  byAddonId: { [number]: Array<AddonType> },
  byAddonSlug: { [string]: Array<number> },
  byUserId: { [number]: Array<number> },
  byUsername: { [string]: Array<number> },
};

export const initialState: State = {
  byAddonId: {},
  byAddonSlug: {},
  byUserId: {},
  byUsername: {},
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
  forAddonSlug?: string,
|};

type FetchAddonsByAuthorsAction = {|
  type: typeof FETCH_ADDONS_BY_AUTHORS,
  payload: FetchAddonsByAuthorsParams,
|};

export const fetchAddonsByAuthors = (
  { addonType, authors, errorHandlerId, forAddonSlug }: FetchAddonsByAuthorsParams
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
      forAddonSlug,
    },
  };
};

type LoadAddonsByAuthorsParams = {|
  addons: Array<ExternalAddonType>,
  forAddonSlug?: string,
|};

type LoadAddonsByAuthorsAction = {|
  type: typeof LOAD_ADDONS_BY_AUTHORS,
  payload: LoadAddonsByAuthorsParams,
|};

export const loadAddonsByAuthors = (
  { addons, forAddonSlug }: LoadAddonsByAuthorsParams
): LoadAddonsByAuthorsAction => {
  invariant(addons, 'A set of add-ons is required.');

  return {
    type: LOAD_ADDONS_BY_AUTHORS,
    payload: { addons, forAddonSlug },
  };
};

export const getAddonsForSlug = (state: State, slug: string) => {
  const ids = state.byAddonSlug[slug];

  return ids ? ids.map((id) => {
    return state.byAddonId[id];
  }) : null;
};

type Action =
  | FetchAddonsByAuthorsAction
  | LoadAddonsByAuthorsAction;

const reducer = (
  state: State = initialState,
  action: Action
): State => {
  switch (action.type) {
    case FETCH_ADDONS_BY_AUTHORS: {
      const newState = deepcopy(state);

      if (action.payload.forAddonSlug) {
        newState.byAddonSlug = {
          ...newState.byAddonSlug,
          [action.payload.forAddonSlug]: undefined,
        };
      }

      // Reset the data for each author requested.
      for (const authorUsername of action.payload.authors) {
        // TODO: Reset the userId here too.
        newState.byUsername[authorUsername] = undefined;
      }

      return newState;
    }
    case LOAD_ADDONS_BY_AUTHORS: {
      const newState = deepcopy(state);

      if (action.payload.forAddonSlug) {
        newState.byAddonSlug = {
          [action.payload.forAddonSlug]: action.payload.addons
            .slice(0, ADDONS_BY_AUTHORS_PAGE_SIZE)
            .map((addon) => addon.id),
        };
      }

      const addons = action.payload.addons
        .map((addon) => createInternalAddon(addon));

      for (const addon of addons) {
        newState.byAddonId[addon.id] = addon;

        if (addon.authors) {
          for (const author of addon.authors) {
            if (!newState.byUserId[author.id]) {
              newState.byUserId[author.id] = [];
            }
            if (!newState.byUsername[author.username]) {
              newState.byUsername[author.username] = [];
            }

            if (!newState.byUserId[author.id].includes(addon.id)) {
              newState.byUserId[author.id].push(addon.id);
            }

            if (!newState.byUsername[author.username].includes(addon.id)) {
              newState.byUsername[author.username].push(addon.id);
            }
          }
        }
      }

      return newState;
    }
    default:
      return state;
  }
};

export default reducer;
