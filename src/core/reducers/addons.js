/* @flow */
import invariant from 'invariant';
import { oneLine } from 'common-tags';

import { UNLOAD_ADDON_REVIEWS } from 'amo/actions/reviews';
import { removeUndefinedProps } from 'core/utils/addons';
import {
  ADDON_TYPE_THEME,
  OS_ALL,
  OS_ANDROID,
  OS_LINUX,
  OS_MAC,
  OS_WINDOWS,
} from 'core/constants';
import log from 'core/logger';
import type { UnloadAddonReviewsAction } from 'amo/actions/reviews';
import type { ExternalAddonInfoType } from 'amo/api/addonInfo';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type {
  AddonType,
  ExternalAddonType,
  ExternalAddonVersionType,
  PlatformFilesType,
  PartialExternalAddonType,
  PartialExternalAddonVersionType,
  ThemeData,
} from 'core/types/addons';
import type { AppState as DiscoAppState } from 'disco/store';

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

export function getGuid(
  addon: ExternalAddonType | PartialExternalAddonType,
): string {
  if (addon.type === ADDON_TYPE_THEME) {
    // This mimics how Firefox appends @personas.mozilla.org internally.
    // It's needed to look up themes in mozAddonManager.
    return `${addon.id}@personas.mozilla.org`;
  }
  return addon.guid;
}

export function createInternalThemeData(
  apiAddon: ExternalAddonType | PartialExternalAddonType,
): ThemeData | null {
  if (!apiAddon.theme_data) {
    return null;
  }

  return {
    accentcolor: apiAddon.theme_data.accentcolor,
    author: apiAddon.theme_data.author,
    category: apiAddon.theme_data.category,
    description: apiAddon.theme_data.description,
    detailURL: apiAddon.theme_data.detailURL,
    footer: apiAddon.theme_data.footer,
    footerURL: apiAddon.theme_data.footerURL,
    header: apiAddon.theme_data.header,
    headerURL: apiAddon.theme_data.headerURL,
    iconURL: apiAddon.theme_data.iconURL,
    id: apiAddon.theme_data.id,
    name: apiAddon.theme_data.name,
    previewURL: apiAddon.theme_data.previewURL,
    textcolor: apiAddon.theme_data.textcolor,
    updateURL: apiAddon.theme_data.updateURL,
    version: apiAddon.theme_data.version,
  };
}

export const defaultPlatformFiles: PlatformFilesType = Object.freeze({
  [OS_ALL]: undefined,
  [OS_ANDROID]: undefined,
  [OS_LINUX]: undefined,
  [OS_MAC]: undefined,
  [OS_WINDOWS]: undefined,
});

export const createPlatformFiles = (
  version?: ExternalAddonVersionType | PartialExternalAddonVersionType,
): PlatformFilesType => {
  const platformFiles = { ...defaultPlatformFiles };

  if (version && version.files.length > 0) {
    version.files.forEach((file) => {
      // eslint-disable-next-line no-prototype-builtins
      if (!platformFiles.hasOwnProperty(file.platform)) {
        // You wouldn't think this is needed, but Flow.
        invariant(version, 'version is required');
        log.warn(oneLine`A version with id ${version.id}
          has a file with an unknown platform: ${file.platform}`);
      }
      platformFiles[file.platform] = file;
    });
  }
  return platformFiles;
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
    current_version: apiAddon.current_version,
    default_locale: apiAddon.default_locale,
    description: apiAddon.description,
    edit_url: apiAddon.edit_url,
    guid: getGuid(apiAddon),
    has_eula: apiAddon.has_eula,
    has_privacy_policy: apiAddon.has_privacy_policy,
    homepage: apiAddon.homepage,
    icon_url: apiAddon.icon_url,
    id: apiAddon.id,
    is_disabled: apiAddon.is_disabled,
    is_experimental: apiAddon.is_experimental,
    is_featured: apiAddon.is_featured,
    is_source_public: apiAddon.is_source_public,
    last_updated: apiAddon.last_updated,
    latest_unlisted_version: apiAddon.latest_unlisted_version,
    locale_disambiguation: apiAddon.locale_disambiguation,
    name: apiAddon.name,
    previews: apiAddon.previews,
    public_stats: apiAddon.public_stats,
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
    platformFiles: createPlatformFiles(apiAddon.current_version),
    themeData: createInternalThemeData(apiAddon),
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
  state: AppState | DiscoAppState,
  id: AddonID,
): AddonType | null => {
  return state.addons.byID[`${id}`] || null;
};

export const getAddonBySlug = (
  state: AppState,
  slug: string,
): AddonType | null => {
  if (typeof slug !== 'string') {
    return null;
  }

  const addonId = state.addons.bySlug[slug.toLowerCase()];

  return getAddonByID(state, addonId);
};

export const getAddonByGUID = (
  state: AppState | DiscoAppState,
  guid: string,
): AddonType | null => {
  const addonId = state.addons.byGUID[guid];

  return getAddonByID(state, addonId);
};

export const isAddonLoading = (state: AppState, slug: string): boolean => {
  if (typeof slug !== 'string') {
    return false;
  }

  return Boolean(state.addons.loadingBySlug[slug.toLowerCase()]);
};

export const getAllAddons = (state: AppState): Array<AddonType> => {
  const addons = state.addons.byID;

  // $FLOW_FIXME: see https://github.com/facebook/flow/issues/2221.
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
  | UnloadAddonReviewsAction;

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
          // `guid` is already "normalized" with the `getGuid()` function in
          // `createInternalAddon()`.
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
      const addon = state.byID[`${addonId}`];
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
