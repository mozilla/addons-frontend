/* @flow */
import deepcopy from 'deepcopy';
import invariant from 'invariant';

import { createInternalAddon } from 'core/reducers/addons';
import type {
  ExternalAddonType,
  SearchResultAddonType,
} from 'core/types/addons';
import { getAddonTypeFilter } from 'core/utils';

type AddonId = number;

export type AddonsByAuthorsState = {|
  // TODO: It might be nice to eventually stop storing add-ons in this
  // reducer at all and rely on the add-ons in the `addons` reducer.
  // That said, these are partial add-ons returned from the search
  // results and fetching all add-on data for each add-on might be too
  // expensive.
  byAddonId: { [AddonId]: SearchResultAddonType },
  byAddonSlug: { [string]: Array<AddonId> },
  byUserId: { [number]: Array<AddonId> },
  byUsername: { [string]: Array<AddonId> },
  countFor: { [string]: number },
  loadingFor: { [string]: boolean },
|};

export const initialState: AddonsByAuthorsState = {
  byAddonId: {},
  byAddonSlug: {},
  byUserId: {},
  byUsername: {},
  countFor: {},
  loadingFor: {},
};

export const EXTENSIONS_BY_AUTHORS_PAGE_SIZE = 10;
export const THEMES_BY_AUTHORS_PAGE_SIZE = 12;

// For further information about this notation, see:
// https://github.com/mozilla/addons-frontend/pull/3027#discussion_r137661289
export const FETCH_ADDONS_BY_AUTHORS: 'FETCH_ADDONS_BY_AUTHORS' =
  'FETCH_ADDONS_BY_AUTHORS';
export const LOAD_ADDONS_BY_AUTHORS: 'LOAD_ADDONS_BY_AUTHORS' =
  'LOAD_ADDONS_BY_AUTHORS';

export type FetchAddonsByAuthorsParams = {|
  addonType?: string,
  authorUsernames: Array<string>,
  errorHandlerId: string,
  forAddonSlug?: string,
  page?: number,
  pageSize: number,
  sort?: string,
|};

type FetchAddonsByAuthorsAction = {|
  type: typeof FETCH_ADDONS_BY_AUTHORS,
  payload: FetchAddonsByAuthorsParams,
|};

export const fetchAddonsByAuthors = ({
  addonType,
  authorUsernames,
  errorHandlerId,
  forAddonSlug,
  page,
  pageSize,
  sort,
}: FetchAddonsByAuthorsParams): FetchAddonsByAuthorsAction => {
  invariant(errorHandlerId, 'An errorHandlerId is required');
  invariant(authorUsernames, 'authorUsernames are required.');
  invariant(
    Array.isArray(authorUsernames),
    'The authorUsernames parameter must be an array.',
  );
  invariant(pageSize, 'pageSize is required.');

  return {
    type: FETCH_ADDONS_BY_AUTHORS,
    payload: {
      addonType,
      authorUsernames,
      errorHandlerId,
      forAddonSlug,
      page,
      pageSize,
      sort,
    },
  };
};

type LoadAddonsByAuthorsParams = {|
  addonType?: string,
  addons: Array<ExternalAddonType>,
  authorUsernames: Array<string>,
  count: number,
  forAddonSlug?: string,
  pageSize: number,
|};

type LoadAddonsByAuthorsAction = {|
  type: typeof LOAD_ADDONS_BY_AUTHORS,
  payload: LoadAddonsByAuthorsParams,
|};

export const loadAddonsByAuthors = ({
  addonType,
  addons,
  authorUsernames,
  count,
  forAddonSlug,
  pageSize,
}: LoadAddonsByAuthorsParams): LoadAddonsByAuthorsAction => {
  invariant(addons, 'A set of add-ons is required.');
  invariant(authorUsernames, 'A list of authorUsernames is required.');
  invariant(typeof count === 'number', 'count is required.');
  invariant(pageSize, 'pageSize is required.');

  return {
    type: LOAD_ADDONS_BY_AUTHORS,
    payload: {
      addonType,
      addons,
      authorUsernames,
      count,
      forAddonSlug,
      pageSize,
    },
  };
};

export const joinAuthorNamesAndAddonType = (
  authorUsernames: Array<string>,
  addonType?: string,
) => {
  return authorUsernames.sort().join('-') + (addonType ? `-${addonType}` : '');
};

export const getLoadingForAuthorNames = (
  state: AddonsByAuthorsState,
  authorUsernames: Array<string>,
  addonType?: string,
): boolean | null => {
  return (
    state.loadingFor[joinAuthorNamesAndAddonType(authorUsernames, addonType)] ||
    null
  );
};

export const getCountForAuthorNames = (
  state: AddonsByAuthorsState,
  authorUsernames: Array<string>,
  addonType?: string,
) => {
  return (
    state.countFor[joinAuthorNamesAndAddonType(authorUsernames, addonType)] ||
    null
  );
};

export const getAddonsForSlug = (
  state: AddonsByAuthorsState,
  slug: string,
): Array<SearchResultAddonType> | null => {
  const ids = state.byAddonSlug[slug];

  return ids
    ? ids.map((id) => {
        return state.byAddonId[id];
      })
    : null;
};

export const getAddonsForUsernames = (
  state: AddonsByAuthorsState,
  usernames: Array<string>,
  addonType?: string,
  excludeSlug?: string,
): Array<SearchResultAddonType> | null => {
  invariant(usernames && usernames.length, 'At least one username is required');

  const ids = usernames
    .map((username) => {
      return state.byUsername[username];
    })
    .reduce((array, addonIds) => {
      if (addonIds) {
        for (const addonId of addonIds) {
          if (!array.includes(addonId)) {
            array.push(addonId);
          }
        }
      }

      return array;
    }, []);

  return ids.length
    ? ids
        .map((id) => {
          return state.byAddonId[id];
        })
        .filter((addon) => {
          const addonTypeFilter = getAddonTypeFilter(addonType);
          return addonType ? addonTypeFilter.includes(addon.type) : true;
        })
        .filter((addon) => {
          return addon.slug !== excludeSlug;
        })
    : null;
};

type Action = FetchAddonsByAuthorsAction | LoadAddonsByAuthorsAction;

const reducer = (
  state: AddonsByAuthorsState = initialState,
  action: Action,
): AddonsByAuthorsState => {
  switch (action.type) {
    case FETCH_ADDONS_BY_AUTHORS: {
      const newState = deepcopy(state);

      const { addonType, authorUsernames, forAddonSlug } = action.payload;

      if (forAddonSlug) {
        newState.byAddonSlug = {
          ...newState.byAddonSlug,
          [forAddonSlug]: undefined,
        };
      } else if (authorUsernames.length) {
        // Potentially remove add-ons loaded for these authors with this add-on
        // type, so that we can load new add-ons in the UI (pagination). We do
        // not do it when `forAddonSlug` is defined to avoid re-fetching the
        // add-ons by authors on an add-on detail page.

        const addonsToRemove = getAddonsForUsernames(
          newState,
          authorUsernames,
          addonType,
        );

        if (addonsToRemove) {
          for (const addonToRemove of addonsToRemove) {
            newState.byAddonId[addonToRemove.id] = undefined;

            if (addonToRemove.authors) {
              for (const author of addonToRemove.authors) {
                newState.byUsername[author.username] = newState.byUsername[
                  author.username
                ].filter((id) => id !== addonToRemove.id);

                newState.byUserId[author.id] = newState.byUserId[
                  author.id
                ].filter((id) => id !== addonToRemove.id);
              }
            }
          }
        }
      }

      const authorNamesWithAddonType = joinAuthorNamesAndAddonType(
        authorUsernames,
        addonType,
      );

      newState.loadingFor[authorNamesWithAddonType] = true;
      newState.countFor[authorNamesWithAddonType] = null;

      return newState;
    }
    case LOAD_ADDONS_BY_AUTHORS: {
      const newState = deepcopy(state);

      const {
        addonType,
        addons,
        authorUsernames,
        count,
        forAddonSlug,
        pageSize,
      } = action.payload;

      if (forAddonSlug) {
        newState.byAddonSlug = {
          ...newState.byAddonSlug,
          [forAddonSlug]: addons.slice(0, pageSize).map((addon) => addon.id),
        };
      }

      const authorNamesWithAddonType = joinAuthorNamesAndAddonType(
        authorUsernames,
        addonType,
      );

      newState.countFor[authorNamesWithAddonType] = count;
      newState.loadingFor[authorNamesWithAddonType] = false;

      const internalAddons = addons.map((addon) => createInternalAddon(addon));

      for (const addon of internalAddons) {
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
