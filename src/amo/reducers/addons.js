/* @flow */
import invariant from 'invariant';

import { CLIENT_APP_ANDROID, ADDON_TYPE_EXTENSION } from 'amo/constants';
import {
  UNLOAD_ADDON_REVIEWS,
  UPDATE_RATING_COUNTS,
} from 'amo/actions/reviews';
import type {
  UnloadAddonReviewsAction,
  UpdateRatingCountsAction,
} from 'amo/actions/reviews';
import {
  selectLocalizedContent,
  selectCategoryObject,
} from 'amo/reducers/utils';
import { SET_LANG } from 'amo/reducers/api';
import type { ExternalAddonInfoType } from 'amo/api/addonInfo';
import type { AppState } from 'amo/store';
import type {
  AddonType,
  ExternalAddonType,
  ExternalPreviewType,
  GroupedRatingsType,
  PartialExternalAddonType,
  PreviewType,
} from 'amo/types/addons';
import type { LocalizedUrlWithOutgoing, UrlWithOutgoing } from 'amo/types/api';
import type { ErrorHandlerType } from 'amo/types/errorHandler';

export const FETCH_ADDON_INFO: 'FETCH_ADDON_INFO' = 'FETCH_ADDON_INFO';
export const LOAD_ADDON_INFO: 'LOAD_ADDON_INFO' = 'LOAD_ADDON_INFO';

export const FETCH_ADDON: 'FETCH_ADDON' = 'FETCH_ADDON';
export const LOAD_ADDON: 'LOAD_ADDON' = 'LOAD_ADDON';

type AddonID = number;

export type AddonInfoType = {
  eula: string | null,
  privacyPolicy: string | null,
};

export type AddonsState = {|
  // Flow wants hash maps with string keys.
  // See: https://zhenyong.github.io/flowtype/docs/objects.html#objects-as-maps
  byID: { [addonId: string]: AddonType },
  byIdInURL: { [id: string]: AddonID },
  byGUID: { [addonGUID: string]: AddonID },
  bySlug: { [addonSlug: string]: AddonID },
  infoBySlug: {
    [slug: string]: {| info: AddonInfoType, loading: boolean |},
  },
  lang: string,
  loadingByIdInURL: { [id: string]: boolean },
|};

export const initialState: AddonsState = {
  byID: {},
  byIdInURL: {},
  byGUID: {},
  bySlug: {},
  infoBySlug: {},
  // We default lang to '' to avoid having to add a lot of invariants to our
  // code, and protect against a lang of '' in selectLocalizedContent.
  lang: '',
  loadingByIdInURL: {},
};

type FetchAddonParams = {|
  errorHandler: ErrorHandlerType,
  showGroupedRatings?: boolean,
  slug: string,
  assumeNonPublic?: boolean,
|};

export type FetchAddonAction = {|
  type: typeof FETCH_ADDON,
  payload: {|
    errorHandlerId: string,
    showGroupedRatings?: boolean,
    slug: string,
    assumeNonPublic?: boolean,
  |},
|};

export function fetchAddon({
  errorHandler,
  showGroupedRatings = false,
  slug,
  assumeNonPublic = false,
}: FetchAddonParams): FetchAddonAction {
  if (!errorHandler) {
    throw new Error('errorHandler cannot be empty');
  }
  if (!slug) {
    throw new Error('slug cannot be empty');
  }
  return {
    type: FETCH_ADDON,
    payload: {
      errorHandlerId: errorHandler.id,
      showGroupedRatings,
      slug,
      assumeNonPublic,
    },
  };
}

type LoadAddonParams = {|
  addon: ExternalAddonType,
  slug: string,
|};

export type LoadAddonAction = {|
  payload: LoadAddonParams,
  type: typeof LOAD_ADDON,
|};

export function loadAddon({ addon, slug }: LoadAddonParams): LoadAddonAction {
  invariant(addon, 'addon is required');
  invariant(slug, 'slug is required');

  return {
    type: LOAD_ADDON,
    payload: { addon, slug },
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
}: LoadAddonInfoParams): LoadAddonInfoAction => {
  invariant(info, 'info is required');
  invariant(slug, 'slug is required');

  return {
    type: LOAD_ADDON_INFO,
    payload: { info, slug },
  };
};

export const createInternalPreviews = (
  previews: Array<ExternalPreviewType>,
  lang: string,
): Array<PreviewType> => {
  return previews.map((preview) => ({
    h: preview.image_size[1],
    src: preview.image_url,
    thumbnail_h: preview.thumbnail_size[1],
    thumbnail_src: preview.thumbnail_url,
    thumbnail_w: preview.thumbnail_size[0],
    title: selectLocalizedContent(preview.caption, lang),
    w: preview.image_size[0],
  }));
};

export const selectLocalizedUrlWithOutgoing = (
  url: LocalizedUrlWithOutgoing | null,
  lang: string,
): UrlWithOutgoing | null => {
  if (url && url.url && url.outgoing) {
    return {
      url: selectLocalizedContent(url.url, lang),
      outgoing: selectLocalizedContent(url.outgoing, lang),
    };
  }

  return null;
};

export function createInternalAddon(
  apiAddon: ExternalAddonType | PartialExternalAddonType,
  lang: string,
): AddonType {
  const addon: AddonType = {
    authors: apiAddon.authors,
    average_daily_users: apiAddon.average_daily_users,
    categories: selectCategoryObject(apiAddon),
    contributions_url: apiAddon.contributions_url,
    created: apiAddon.created,
    default_locale: apiAddon.default_locale,
    description: selectLocalizedContent(apiAddon.description, lang),
    developer_comments: selectLocalizedContent(
      apiAddon.developer_comments,
      lang,
    ),
    edit_url: apiAddon.edit_url,
    guid: apiAddon.guid,
    has_eula: apiAddon.has_eula,
    has_privacy_policy: apiAddon.has_privacy_policy,
    homepage: selectLocalizedUrlWithOutgoing(apiAddon.homepage, lang),
    icon_url: apiAddon.icon_url,
    icons: apiAddon.icons,
    id: apiAddon.id,
    is_disabled: apiAddon.is_disabled,
    is_experimental: apiAddon.is_experimental,
    is_source_public: apiAddon.is_source_public,
    last_updated: apiAddon.last_updated,
    latest_unlisted_version: apiAddon.latest_unlisted_version,
    locale_disambiguation: apiAddon.locale_disambiguation,
    name: selectLocalizedContent(apiAddon.name, lang),
    previews: apiAddon.previews
      ? createInternalPreviews(apiAddon.previews, lang)
      : undefined,
    promoted: apiAddon.promoted,
    ratings: apiAddon.ratings,
    requires_payment: apiAddon.requires_payment,
    review_url: apiAddon.review_url,
    slug: apiAddon.slug,
    status: apiAddon.status,
    summary: selectLocalizedContent(apiAddon.summary, lang),
    support_email: selectLocalizedContent(apiAddon.support_email, lang),
    support_url: selectLocalizedUrlWithOutgoing(apiAddon.support_url, lang),
    tags: apiAddon.tags,
    target_locale: apiAddon.target_locale,
    type: apiAddon.type,
    url: apiAddon.url,
    weekly_downloads: apiAddon.weekly_downloads,

    // These are custom properties not in the API response.
    currentVersionId: apiAddon.current_version
      ? apiAddon.current_version.id
      : null,
    isMozillaSignedExtension: false,
    isAndroidCompatible: false,
  };

  const currentVersion = apiAddon.current_version;

  if (currentVersion) {
    addon.isMozillaSignedExtension =
      currentVersion.file.is_mozilla_signed_extension;
    addon.isAndroidCompatible =
      addon.type === ADDON_TYPE_EXTENSION &&
      !!currentVersion.compatibility[CLIENT_APP_ANDROID] &&
      currentVersion.compatibility[CLIENT_APP_ANDROID].max === '*';
  }

  return addon;
}

export const getAddonByID = (
  addons: AddonsState,
  id: AddonID,
): AddonType | null => {
  return addons.byID[`${id}`] || null;
};

export const getAddonByIdInURL = (
  addons: AddonsState,
  id: string,
): AddonType | null => {
  const addonId = addons.byIdInURL[id];

  return getAddonByID(addons, addonId);
};

export const isAddonLoading = (state: AppState, id: string): boolean => {
  if (typeof id !== 'string') {
    return false;
  }

  return Boolean(state.addons.loadingByIdInURL[id]);
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
  lang: string,
): AddonInfoType => {
  return {
    eula: selectLocalizedContent(addonInfo.eula, lang),
    privacyPolicy: selectLocalizedContent(addonInfo.privacy_policy, lang),
  };
};

export function createGroupedRatings(
  grouping: $Shape<GroupedRatingsType> = {},
): GroupedRatingsType {
  return {
    /* eslint-disable quote-props */
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
    /* eslint-enable quote-props */
    ...grouping,
  };
}

type Action =
  | FetchAddonAction
  | FetchAddonInfoAction
  | LoadAddonInfoAction
  | LoadAddonAction
  | UnloadAddonReviewsAction
  | UpdateRatingCountsAction;

export default function addonsReducer(
  // eslint-disable-next-line default-param-last
  state: AddonsState = initialState,
  action: Action,
): AddonsState {
  switch (action.type) {
    case SET_LANG:
      return {
        ...state,
        lang: action.payload.lang,
      };

    case FETCH_ADDON: {
      const { slug } = action.payload;

      return {
        ...state,
        loadingByIdInURL: {
          ...state.loadingByIdInURL,
          [slug]: true,
        },
      };
    }

    case LOAD_ADDON: {
      const { addon: loadedAddon, slug } = action.payload;

      const byID = { ...state.byID };
      const byGUID = { ...state.byGUID };
      const bySlug = { ...state.bySlug };
      const byIdInURL = { ...state.byIdInURL };
      const loadingByIdInURL = { ...state.loadingByIdInURL };

      const addon = createInternalAddon(loadedAddon, state.lang);
      // Flow wants hash maps with string keys.
      // See: https://zhenyong.github.io/flowtype/docs/objects.html#objects-as-maps
      byID[`${addon.id}`] = addon;

      byIdInURL[slug] = addon.id;
      loadingByIdInURL[slug] = false;

      if (addon.slug) {
        bySlug[addon.slug.toLowerCase()] = addon.id;
      }

      if (addon.guid) {
        byGUID[addon.guid] = addon.id;
      }

      return {
        ...state,
        byID,
        byGUID,
        bySlug,
        byIdInURL,
        loadingByIdInURL,
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
          loadingByIdInURL: {
            ...state.loadingByIdInURL,
            [addon.slug]: undefined,
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

      const newGroupedRatings = ratings
        ? { ...ratings.grouped_counts }
        : createGroupedRatings();

      if (
        oldReview &&
        oldReview.score &&
        newGroupedRatings[oldReview.score] > 0
      ) {
        newGroupedRatings[oldReview.score] -= 1;
      }
      if (newReview && newReview.score) {
        newGroupedRatings[newReview.score] += 1;
      }

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
              grouped_counts: newGroupedRatings,
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
            info: createInternalAddonInfo(info, state.lang),
            loading: false,
          },
        },
      };
    }

    default:
      return state;
  }
}
