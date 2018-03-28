/* @flow */
import deepcopy from 'deepcopy';
import invariant from 'invariant';

import { createInternalAddon } from 'core/reducers/addons';
import type {
  AddonType, ExternalAddonType,
} from 'core/types/addons';


type AddonId = number;

export type AddonsByAuthorsState = {|
  // TODO: It might be nice to eventually stop storing add-ons in this
  // reducer at all and rely on the add-ons in the `addons` reducer.
  // That said, these are partial add-ons returned from the search
  // results and fetching all add-on data for each add-on might be too
  // expensive.
  byAddonId: { [AddonId]: AddonType },
  byAddonSlug: { [string]: Array<AddonId> },
  byUserId: { [number]: Array<AddonId> },
  byUsername: { [string]: Array<AddonId> },
  forAuthorNamesAndAddonType: { [string]: Array<AddonId> | null },
  loadingFor: { [string]: boolean },
|};

export const initialState: AddonsByAuthorsState = {
  byAddonId: {},
  byAddonSlug: {},
  byUserId: {},
  byUsername: {},
  forAuthorNamesAndAddonType: {},
  loadingFor: {},
};

export const ADDONS_BY_AUTHORS_PAGE_SIZE = 6;

// For further information about this notation, see:
// https://github.com/mozilla/addons-frontend/pull/3027#discussion_r137661289
export const FETCH_ADDONS_BY_AUTHORS: 'FETCH_ADDONS_BY_AUTHORS'
  = 'FETCH_ADDONS_BY_AUTHORS';
export const LOAD_ADDONS_BY_AUTHORS: 'LOAD_ADDONS_BY_AUTHORS'
  = 'LOAD_ADDONS_BY_AUTHORS';

type FetchAddonsByAuthorsParams = {|
  addonType?: string,
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
  addonType?: string,
  authors: Array<string>,
  forAddonSlug?: string,
|};

type LoadAddonsByAuthorsAction = {|
  type: typeof LOAD_ADDONS_BY_AUTHORS,
  payload: LoadAddonsByAuthorsParams,
|};

export const loadAddonsByAuthors = (
  { addons, addonType, authors, forAddonSlug }: LoadAddonsByAuthorsParams
): LoadAddonsByAuthorsAction => {
  invariant(addons, 'A set of add-ons is required.');
  invariant(authors, 'A list of authors is required.');

  return {
    type: LOAD_ADDONS_BY_AUTHORS,
    payload: { addons, addonType, authors, forAddonSlug },
  };
};

export const joinAuthorNames = (
  authorNames: Array<string>, addonType?: string
) => {
  return authorNames.sort().join('-') + (addonType ? `-${addonType}` : '');
};

export const getLoadingForAuthorNames = (
  state: AddonsByAuthorsState, authorNames: Array<string>, addonType?: string
) => {
  return authorNames && authorNames.length ?
    (state.loadingFor[joinAuthorNames(authorNames, addonType)] || null) : null;
};

export const getAddonsForSlug = (
  state: AddonsByAuthorsState,
  slug: string,
) => {
  const ids = state.byAddonSlug[slug];

  return ids ? ids.map((id) => {
    return state.byAddonId[id];
  }) : null;
};

export const getAddonsForUsernames = (
  state: AddonsByAuthorsState,
  usernames: Array<string>,
  addonType?: string,
  excludeSlug?: string,
) => {
  invariant(usernames && usernames.length, 'At least one username is required');

  const ids = usernames.map((username) => {
    return state.byUsername[username];
  }).reduce((array, addonIds) => {
    if (!addonIds || !array) {
      return null;
    }

    for (const addonId of addonIds) {
      if (!array.includes(addonId)) {
        array.push(addonId);
      }
    }

    return array;
  }, []);

  return ids ? (ids
    .map((id) => {
      return state.byAddonId[id];
    })
    .filter((addon) => {
      return addonType ? addon.type === addonType : true;
    })
    .filter((addon) => {
      return addon.slug !== excludeSlug;
    })
  ) : null;
};

type Action =
  | FetchAddonsByAuthorsAction
  | LoadAddonsByAuthorsAction;

const reducer = (
  state: AddonsByAuthorsState = initialState,
  action: Action
): AddonsByAuthorsState => {
  switch (action.type) {
    case FETCH_ADDONS_BY_AUTHORS: {
      const newState = deepcopy(state);

      if (action.payload.forAddonSlug) {
        newState.byAddonSlug = {
          ...newState.byAddonSlug,
          [action.payload.forAddonSlug]: undefined,
        };
      }

      newState.loadingFor[joinAuthorNames(
        action.payload.authors, action.payload.addonType)] = true;
      newState.forAuthorNamesAndAddonType[joinAuthorNames(
        action.payload.authors, action.payload.addonType)] = null;

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

      const authorNamesWithAddonType = joinAuthorNames(
        action.payload.authors, action.payload.addonType);

      newState.forAuthorNamesAndAddonType[authorNamesWithAddonType] = [];
      newState.loadingFor[authorNamesWithAddonType] = false;

      for (const addon of addons) {
        newState.byAddonId[addon.id] = addon;
        newState.forAuthorNamesAndAddonType[authorNamesWithAddonType]
          .push(addon.id);

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
