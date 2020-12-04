/* @flow */
import deepcopy from 'deepcopy';
import invariant from 'invariant';

import { createInternalAddon } from 'core/reducers/addons';
import { SET_LANG } from 'core/reducers/api';
import type { AddonType, ExternalAddonType } from 'core/types/addons';

type AddonId = number;

export type AddonsByAuthorsState = {|
  lang: string,
  // TODO: It might be nice to eventually stop storing add-ons in this
  // reducer at all and rely on the add-ons in the `addons` reducer.
  // That said, these are partial add-ons returned from the search
  // results and fetching all add-on data for each add-on might be too
  // expensive.
  byAddonId: { [AddonId]: AddonType },
  byAddonSlug: { [string]: Array<AddonId> },
  byAuthorId: { [number]: Array<AddonId> },
  countFor: { [string]: number },
  loadingFor: { [string]: boolean },
|};

export const initialState: AddonsByAuthorsState = {
  lang: '',
  byAddonId: {},
  byAddonSlug: {},
  byAuthorId: {},
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
  authorIds: Array<number>,
  errorHandlerId: string,
  forAddonSlug?: string,
  page?: string,
  pageSize: string,
  sort?: string,
|};

export type FetchAddonsByAuthorsAction = {|
  type: typeof FETCH_ADDONS_BY_AUTHORS,
  payload: FetchAddonsByAuthorsParams,
|};

export const fetchAddonsByAuthors = ({
  addonType,
  authorIds,
  errorHandlerId,
  forAddonSlug,
  page,
  pageSize,
  sort,
}: FetchAddonsByAuthorsParams): FetchAddonsByAuthorsAction => {
  invariant(errorHandlerId, 'An errorHandlerId is required');
  invariant(authorIds, 'authorIds are required.');
  invariant(
    Array.isArray(authorIds),
    'The authorIds parameter must be an array.',
  );
  invariant(pageSize, 'pageSize is required.');

  return {
    type: FETCH_ADDONS_BY_AUTHORS,
    payload: {
      addonType,
      authorIds,
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
  authorIds: Array<number>,
  count: number,
  forAddonSlug?: string,
  pageSize: string,
|};

type LoadAddonsByAuthorsAction = {|
  type: typeof LOAD_ADDONS_BY_AUTHORS,
  payload: LoadAddonsByAuthorsParams,
|};

export const loadAddonsByAuthors = ({
  addonType,
  addons,
  authorIds,
  count,
  forAddonSlug,
  pageSize,
}: LoadAddonsByAuthorsParams): LoadAddonsByAuthorsAction => {
  invariant(addons, 'A set of add-ons is required.');
  invariant(authorIds, 'A list of authorIds is required.');
  invariant(typeof count === 'number', 'count is required.');
  invariant(pageSize, 'pageSize is required.');

  return {
    type: LOAD_ADDONS_BY_AUTHORS,
    payload: {
      addonType,
      addons,
      authorIds,
      count,
      forAddonSlug,
      pageSize,
    },
  };
};

export const joinAuthorIdsAndAddonType = (
  authorIds: Array<number>,
  addonType?: string,
) => {
  return authorIds.sort().join('-') + (addonType ? `-${addonType}` : '');
};

export const getLoadingForAuthorIds = (
  addonsByAuthorsState: AddonsByAuthorsState,
  authorIds: Array<number>,
  addonType?: string,
): boolean | null => {
  const key = joinAuthorIdsAndAddonType(authorIds, addonType);

  if (addonsByAuthorsState.loadingFor[key] === undefined) {
    return null;
  }

  return addonsByAuthorsState.loadingFor[key];
};

export const getCountForAuthorIds = (
  addonsByAuthorsState: AddonsByAuthorsState,
  authorIds: Array<number>,
  addonType?: string,
) => {
  return (
    addonsByAuthorsState.countFor[
      joinAuthorIdsAndAddonType(authorIds, addonType)
    ] || null
  );
};

export const getAddonsForSlug = (
  addonsByAuthorsState: AddonsByAuthorsState,
  slug: string,
): Array<AddonType> | null => {
  const ids = addonsByAuthorsState.byAddonSlug[slug];

  return ids ? ids.map((id) => addonsByAuthorsState.byAddonId[id]) : null;
};

export const getAddonsForAuthorIds = (
  addonsByAuthorsState: AddonsByAuthorsState,
  authorIds: Array<number>,
  addonType?: string,
  excludeSlug?: string,
): Array<AddonType> | null => {
  invariant(
    authorIds && authorIds.length,
    'At least one authorId is required.',
  );

  const ids = authorIds
    .map((authorId) => {
      return addonsByAuthorsState.byAuthorId[authorId];
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
          return addonsByAuthorsState.byAddonId[id];
        })
        .filter((addon) => {
          return addonType ? addon.type === addonType : true;
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
    case SET_LANG:
      return {
        ...state,
        lang: action.payload.lang,
      };

    case FETCH_ADDONS_BY_AUTHORS: {
      const newState = deepcopy(state);

      const { addonType, authorIds, forAddonSlug } = action.payload;

      if (forAddonSlug) {
        newState.byAddonSlug = {
          ...newState.byAddonSlug,
          [forAddonSlug]: undefined,
        };
      }

      if (authorIds.length) {
        // Potentially remove add-ons loaded for these authors with this add-on
        // type, so that we can load new add-ons in the UI (pagination).

        const addonsToRemove = getAddonsForAuthorIds(
          newState,
          authorIds,
          addonType,
        );

        if (addonsToRemove) {
          for (const addonToRemove of addonsToRemove) {
            if (addonToRemove.authors) {
              for (const author of addonToRemove.authors) {
                newState.byAuthorId[author.id] = newState.byAuthorId[
                  author.id
                ].filter((id) => id !== addonToRemove.id);
              }
            }
          }
        }
      }

      const authorIdsWithAddonType = joinAuthorIdsAndAddonType(
        authorIds,
        addonType,
      );

      newState.loadingFor[authorIdsWithAddonType] = true;
      newState.countFor[authorIdsWithAddonType] = null;

      return newState;
    }
    case LOAD_ADDONS_BY_AUTHORS: {
      const newState = deepcopy(state);

      const {
        addonType,
        addons,
        authorIds,
        count,
        forAddonSlug,
        pageSize,
      } = action.payload;

      if (forAddonSlug) {
        newState.byAddonSlug = {
          ...newState.byAddonSlug,
          [forAddonSlug]: addons
            .slice(0, Number(pageSize))
            .map((addon) => addon.id),
        };
      }

      const authorIdsWithAddonType = joinAuthorIdsAndAddonType(
        authorIds,
        addonType,
      );

      newState.countFor[authorIdsWithAddonType] = count;
      newState.loadingFor[authorIdsWithAddonType] = false;

      const internalAddons = addons.map((addon) =>
        createInternalAddon(addon, state.lang),
      );

      for (const addon of internalAddons) {
        newState.byAddonId[addon.id] = addon;

        if (addon.authors) {
          for (const author of addon.authors) {
            if (!newState.byAuthorId[author.id]) {
              newState.byAuthorId[author.id] = [];
            }

            if (!newState.byAuthorId[author.id].includes(addon.id)) {
              newState.byAuthorId[author.id].push(addon.id);
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
