/* @flow */
import invariant from 'invariant';

import {
  UNLOAD_ADDON_REVIEWS,
  UPDATE_RATING_COUNTS,
} from 'amo/actions/reviews';
import { removeUndefinedProps } from 'core/utils/url';
import type {
  UnloadAddonReviewsAction,
  UpdateRatingCountsAction,
} from 'amo/actions/reviews';
import type { ExternalAddonInfoType } from 'amo/api/addonInfo';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type {
  AddonType,
  ExternalAddonType,
  PartialExternalAddonType,
} from 'core/types/addons';

export const FETCH_ADDON_INFO: 'FETCH_ADDON_INFO' = 'FETCH_ADDON_INFO';
export const LOAD_ADDON_INFO: 'LOAD_ADDON_INFO' = 'LOAD_ADDON_INFO';

export const FETCH_ADDON: 'FETCH_ADDON' = 'FETCH_ADDON';
export const LOAD_ADDON_RESULTS: 'LOAD_ADDON_RESULTS' = 'LOAD_ADDON_RESULTS';

type AddonID = number;

export type AddonInfoType = {
  eula: string | null,
  privacyPolicy: string | null,
};

export type AddonsState = {|
  // Flow wants hash maps with string keys.
  // See: https://zhenyong.github.io/flowtype/docs/objects.html#objects-as-maps
  byID: { [addonId: string]: AddonType },
  byGUID: { [addonGUID: string]: AddonID },
  bySlug: { [addonSlug: string]: AddonID },
  infoBySlug: {
    [slug: string]: {| info: AddonInfoType, loading: boolean |},
  },
  loadingBySlug: { [addonSlug: string]: boolean },
|};

export const initialState: AddonsState = {
  byID: {},
  byGUID: {},
  bySlug: {},
  infoBySlug: {},
  loadingBySlug: {},
};

type FetchAddonParams = {|
  errorHandler: ErrorHandlerType,
  slug: string,
|};

export type FetchAddonAction = {|
  type: typeof FETCH_ADDON,
  payload: {|
    errorHandlerId: string,
    slug: string,
  |},
|};

export function fetchAddon({
  errorHandler,
  slug,
}: FetchAddonParams): FetchAddonAction {
  if (!errorHandler) {
    throw new Error('errorHandler cannot be empty');
  }
  if (!slug) {
    throw new Error('slug cannot be empty');
  }
  return {
    type: FETCH_ADDON,
    payload: { errorHandlerId: errorHandler.id, slug },
  };
}

type LoadAddonResultsParams = {|
  addons: Array<ExternalAddonType>,
|};

export type LoadAddonResultsAction = {|
  payload: LoadAddonResultsParams,
  type: typeof LOAD_ADDON_RESULTS,
|};

export function loadAddonResults({
  addons,
}: LoadAddonResultsParams = {}): LoadAddonResultsAction {
  if (!addons) {
    throw new Error('addons are required');
  }

  return {
    type: LOAD_ADDON_RESULTS,
    payload: { addons },
  };
}

type FetchAddonInfoParams = {|
  errorHandlerId: string,
  slug: string,
|};

export type FetchAddonInfoAction = {|
  type: typeof FETCH_ADDON_INFO,
  payload: FetchAddonInfoParams,
|};

export const fetchAddonInfo = ({
  errorHandlerId,
  slug,
}: FetchAddonInfoParams): FetchAddonInfoAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(slug, 'slug is required');

  return {
    type: FETCH_ADDON_INFO,
    payload: { errorHandlerId, slug },
  };
};

type LoadAddonInfoParams = {|
  info: ExternalAddonInfoType,
  slug: string,
|};

type LoadAddonInfoAction = {|
  type: typeof LOAD_ADDON_INFO,
  payload: LoadAddonInfoParams,
|};

export const loadAddonInfo = ({
  info,
  slug,
}: LoadAddonInfoParams = {}): LoadAddonInfoAction => {
  invariant(info, 'info is required');
  invariant(slug, 'slug is required');

  return {
    type: LOAD_ADDON_INFO,
    payload: { info, slug },
  };
};

export function createInternalAddon(
  apiAddon: ExternalAddonType | PartialExternalAddonType,
): AddonType {
  let addon: AddonType = {
    authors: apiAddon.authors,
    average_daily_users: apiAddon.average_daily_users,
    categories: apiAddon.categories,
    contributions_url: apiAddon.contributions_url,
    created: apiAddon.created,
    default_locale: apiAddon.default_locale,
    description: apiAddon.description,
    developer_comments: apiAddon.developer_comments,
    edit_url: apiAddon.edit_url,
    guid: apiAddon.guid,
    has_eula: apiAddon.has_eula,
    has_privacy_policy: apiAddon.has_privacy_policy,
    homepage: apiAddon.homepage,
    icon_url: apiAddon.icon_url,
    id: apiAddon.id,
    is_disabled: apiAddon.is_disabled,
    is_experimental: apiAddon.is_experimental,
    is_source_public: apiAddon.is_source_public,
    last_updated: apiAddon.last_updated,
    latest_unlisted_version: apiAddon.latest_unlisted_version,
    locale_disambiguation: apiAddon.locale_disambiguation,
    name: apiAddon.name,
    previews: apiAddon.previews,
    promoted: apiAddon.promoted,
    ratings: apiAddon.ratings,
    requires_payment: apiAddon.requires_payment,
    review_url: apiAddon.review_url,
    slug: apiAddon.slug,
    status: apiAddon.status,
    summary: apiAddon.summary,
    support_email: apiAddon.support_email,
    support_url: apiAddon.support_url,
    tags: apiAddon.tags,
    target_locale: apiAddon.target_locale,
    type: apiAddon.type,
    url: apiAddon.url,
    weekly_downloads: apiAddon.weekly_downloads,

    // These are custom properties not in the API response.
    currentVersionId: apiAddon.current_version
      ? apiAddon.current_version.id
      : null,
    isRestartRequired: false,
    isWebExtension: false,
    isMozillaSignedExtension: false,
  };

  const currentVersion = apiAddon.current_version;

  if (
    currentVersion &&
    currentVersion.files &&
    currentVersion.files.length > 0
  ) {
    addon.isRestartRequired = currentVersion.files.some(
      (file) => !!file.is_restart_required,
    );
    // The following checks are a bit fragile since only one file needs
    // to contain the flag. However, it is highly unlikely to create an
    // add-on with mismatched file flags in the current DevHub.
    addon.isWebExtension = currentVersion.files.some(
      (file) => !!file.is_webextension,
    );
    addon.isMozillaSignedExtension = currentVersion.files.some(
      (file) => !!file.is_mozilla_signed_extension,
    );
  }

  // Remove undefined properties entirely. This is for some legacy code
  // in Discopane that relies on spreads to combine a Discopane result
  // (which has a header and description) with a minimal add-on object.
  // For example, the minimal add-on object does not have a description
  // property so the spread should not override `description`.
  addon = removeUndefinedProps(addon);

  return addon;
}

export const getAddonByID = (
  addons: AddonsState,
  id: AddonID,
): AddonType | null => {
  return addons.byID[`${id}`] || null;
};

export const getAddonBySlug = (
  addons: AddonsState,
  slug: string,
): AddonType | null => {
  if (typeof slug !== 'string') {
    return null;
  }

  const addonId = addons.bySlug[slug.toLowerCase()];

  return getAddonByID(addons, addonId);
};

export const getAddonByGUID = (
  addons: AddonsState,
  guid: string,
): AddonType | null => {
  const addonId = addons.byGUID[guid];

  return getAddonByID(addons, addonId);
};

export const isAddonLoading = (state: AppState, slug: string): boolean => {
  if (typeof slug !== 'string') {
    return false;
  }

  return Boolean(state.addons.loadingBySlug[slug.toLowerCase()]);
};

export const getAllAddons = (state: AppState): Array<AddonType> => {
  const addons = state.addons.byID;

  // $FlowFixMe: see https://github.com/facebook/flow/issues/2221.
  return Object.values(addons);
};

type GetBySlugParams = {|
  slug: string,
  state: AddonsState,
|};

export const getAddonInfoBySlug = ({
  slug,
  state,
}: GetBySlugParams): AddonInfoType | null => {
  invariant(slug, 'slug is required');
  invariant(state, 'state is required');

  const infoForSlug = state.infoBySlug[slug];
  return (infoForSlug && infoForSlug.info) || null;
};

export const isAddonInfoLoading = ({
  slug,
  state,
}: GetBySlugParams): boolean => {
  invariant(slug, 'slug is required');
  invariant(state, 'state is required');

  const infoForSlug = state.infoBySlug[slug];
  return Boolean(infoForSlug && infoForSlug.loading);
};

export const createInternalAddonInfo = (
  addonInfo: ExternalAddonInfoType,
): AddonInfoType => {
  return {
    eula: addonInfo.eula,
    privacyPolicy: addonInfo.privacy_policy,
  };
};

type Action =
  | FetchAddonAction
  | FetchAddonInfoAction
  | LoadAddonInfoAction
  | LoadAddonResultsAction
  | UnloadAddonReviewsAction
  | UpdateRatingCountsAction;

export default function addonsReducer(
  state: AddonsState = initialState,
  action: Action,
) {
  switch (action.type) {
    case FETCH_ADDON: {
      const { slug } = action.payload;
      return {
        ...state,
        loadingBySlug: {
          ...state.loadingBySlug,
          [slug.toLowerCase()]: true,
        },
      };
    }

    case LOAD_ADDON_RESULTS: {
      const { addons: loadedAddons } = action.payload;

      const byID = { ...state.byID };
      const byGUID = { ...state.byGUID };
      const bySlug = { ...state.bySlug };
      const loadingBySlug = { ...state.loadingBySlug };

      loadedAddons.forEach((loadedAddon) => {
        const addon = createInternalAddon(loadedAddon);
        // Flow wants hash maps with string keys.
        // See: https://zhenyong.github.io/flowtype/docs/objects.html#objects-as-maps
        byID[`${addon.id}`] = addon;

        if (addon.slug) {
          bySlug[addon.slug.toLowerCase()] = addon.id;
          loadingBySlug[addon.slug.toLowerCase()] = false;
        }

        if (addon.guid) {
          byGUID[addon.guid] = addon.id;
        }
      });

      return {
        ...state,
        byID,
        byGUID,
        bySlug,
        loadingBySlug,
      };
    }

    case UNLOAD_ADDON_REVIEWS: {
      const { addonId } = action.payload;
      const addon = getAddonByID(state, addonId);
      if (addon) {
        return {
          ...state,
          byID: {
            ...state.byID,
            [`${addonId}`]: undefined,
          },
          byGUID: {
            ...state.byGUID,
            [addon.guid]: undefined,
          },
          bySlug: {
            ...state.bySlug,
            [addon.slug.toLowerCase()]: undefined,
          },
          loadingBySlug: {
            ...state.loadingBySlug,
            [addon.slug.toLowerCase()]: undefined,
          },
        };
      }
      return state;
    }

    case UPDATE_RATING_COUNTS: {
      const { addonId, oldReview, newReview } = action.payload;

      const addon = getAddonByID(state, addonId);
      if (!addon) {
        return state;
      }

      const { ratings } = addon;
      let average = ratings ? ratings.average : 0;
      let ratingCount = ratings ? ratings.count : 0;
      let reviewCount = ratings ? ratings.text_count : 0;

      let countForAverage = ratingCount;
      if (average && countForAverage && oldReview && oldReview.score) {
        // If average and countForAverage are defined and greater than 0,
        // begin by subtracting the old rating to reset the baseline.
        const countAfterRemoval = countForAverage - 1;

        if (countAfterRemoval === 0) {
          // There are no ratings left.
          average = 0;
        } else {
          // Expand all existing rating scores, take away the old score,
          // and recalculate the average.
          average =
            (average * countForAverage - oldReview.score) / countAfterRemoval;
        }
        countForAverage = countAfterRemoval;
      }

      // Expand all existing rating scores, add in the new score,
      // and recalculate the average.
      average =
        (average * countForAverage + Number(newReview.score)) /
        (countForAverage + 1);

      // Adjust rating / review counts.
      if (!oldReview) {
        // A new rating / review was added.
        ratingCount += 1;
        if (newReview.body) {
          reviewCount += 1;
        }
      } else if (!oldReview.body && newReview.body) {
        // A rating was converted into a review.
        reviewCount += 1;
      }

      return {
        ...state,
        byID: {
          ...state.byID,
          [addonId]: {
            ...addon,
            ratings: {
              ...ratings,
              average,
              // It's impossible to recalculate the bayesian_average
              // (i.e. median) so we set it to the average as an
              // approximation.
              bayesian_average: average,
              count: ratingCount,
              text_count: reviewCount,
            },
          },
        },
      };
    }

    case FETCH_ADDON_INFO: {
      const { slug } = action.payload;
      return {
        ...state,
        infoBySlug: {
          ...state.infoBySlug,
          [slug]: {
            info: undefined,
            loading: true,
          },
        },
      };
    }

    case LOAD_ADDON_INFO: {
      const { slug, info } = action.payload;

      return {
        ...state,
        infoBySlug: {
          ...state.infoBySlug,
          [slug]: {
            info: createInternalAddonInfo(info),
            loading: false,
          },
        },
      };
    }

    default:
      return state;
  }
}
