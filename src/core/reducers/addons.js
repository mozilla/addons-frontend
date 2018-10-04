/* @flow */
import { oneLine } from 'common-tags';

import { UNLOAD_ADDON_REVIEWS } from 'amo/actions/reviews';
import { ADDON_TYPE_THEME } from 'core/constants';
import type { UnloadAddonReviewsAction } from 'amo/actions/reviews';
import type { AppState } from 'amo/store';
import type { AppState as DiscoAppState } from 'disco/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import log from 'core/logger';
import type {
  AddonType,
  ExternalAddonType,
  ThemeData,
} from 'core/types/addons';

export const LOAD_ADDONS: 'LOAD_ADDONS' = 'LOAD_ADDONS';
export const FETCH_ADDON: 'FETCH_ADDON' = 'FETCH_ADDON';
export const LOAD_ADDON_RESULTS: 'LOAD_ADDON_RESULTS' = 'LOAD_ADDON_RESULTS';

type AddonID = number;

export type ExternalAddonMap = {
  [addonSlug: string]: ExternalAddonType,
};

export type LoadAddonsAction = {|
  payload: {| addons: ExternalAddonMap |},
  type: typeof LOAD_ADDONS,
|};

// TODO: We should remove this method and move all calls to `loadAddonResults`.
// This function relies on normalizr messing with our response data.
// See: https://github.com/mozilla/addons-frontend/issues/2917
export function loadAddons(entities: {
  addons: ExternalAddonMap,
}): LoadAddonsAction {
  if (!entities) {
    throw new Error('the entities parameter cannot be empty');
  }
  return {
    type: LOAD_ADDONS,
    // TODO: after https://github.com/mozilla/addons-frontend/issues/2917
    // hopefully this can be a little less fragile. Right now if the
    // caller passes in an incorrect `entities` then we have no way of
    // throwing an error.
    payload: { addons: entities.addons || {} },
  };
}

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
  addons: ExternalAddonMap,
|};

export type LoadAddonResultsAction = {|
  payload: {| addons: ExternalAddonMap |},
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

export function getGuid(addon: ExternalAddonType): string {
  if (addon.type === ADDON_TYPE_THEME) {
    // This mimics how Firefox appends @personas.mozilla.org internally.
    // It's needed to look up themes in mozAddonManager.
    return `${addon.id}@personas.mozilla.org`;
  }
  return addon.guid;
}

export function removeUndefinedProps(object: Object): Object {
  const newObject = {};
  Object.keys(object).forEach((key) => {
    if (typeof object[key] !== 'undefined') {
      newObject[key] = object[key];
    }
  });
  return newObject;
}

export function createInternalThemeData(
  apiAddon: ExternalAddonType,
): ThemeData | null {
  if (!apiAddon.theme_data) {
    return null;
  }

  return {
    accentcolor: apiAddon.theme_data.accentcolor,
    author: apiAddon.theme_data.author,
    category: apiAddon.theme_data.category,

    // TODO: Set this back to apiAddon.theme_data.description after
    // https://github.com/mozilla/addons-frontend/issues/1416 is fixed.
    // theme_data will contain `description: 'None'` when the description is
    // actually `null` and we don't want to set that on the addon itself so we
    // reset it in case it's been overwritten.
    //
    // See also https://github.com/mozilla/addons-server/issues/5650.
    description: apiAddon.description,

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

export function createInternalAddon(apiAddon: ExternalAddonType): AddonType {
  let addon: AddonType = {
    authors: apiAddon.authors,
    average_daily_users: apiAddon.average_daily_users,
    categories: apiAddon.categories,
    contributions_url: apiAddon.contributions_url,
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

    platformFiles: {
      all: undefined,
      android: undefined,
      linux: undefined,
      mac: undefined,
      windows: undefined,
    },
    isRestartRequired: false,
    isWebExtension: false,
    isMozillaSignedExtension: false,
  };

  if (addon.type === ADDON_TYPE_THEME && apiAddon.theme_data) {
    const themeData = createInternalThemeData(apiAddon);

    if (themeData !== null) {
      // This merges theme_data into the addon.
      //
      // TODO: Let's stop doing that because it's confusing. Lots of deep
      // button/install code will need to be fixed.
      //
      // Use addon.themeData[themeProp] instead of addon[themeProp].
      addon = {
        ...addon,
        ...removeUndefinedProps(themeData),
        themeData,
      };
    }
  }

  const currentVersion = apiAddon.current_version;

  if (
    currentVersion &&
    currentVersion.files &&
    currentVersion.files.length > 0
  ) {
    currentVersion.files.forEach((file) => {
      // eslint-disable-next-line no-prototype-builtins
      // eslint-disable-next-line no-prototype-builtins
      if (!addon.platformFiles.hasOwnProperty(file.platform)) {
        log.warn(oneLine`Add-on ID ${apiAddon.id}, slug ${apiAddon.slug}
          has a file with an unknown platform: ${file.platform}`);
      }
      addon.platformFiles[file.platform] = file;
    });
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

export type AddonsState = {|
  // Flow wants hash maps with string keys.
  // See: https://zhenyong.github.io/flowtype/docs/objects.html#objects-as-maps
  byID: { [addonId: string]: AddonType },
  byGUID: { [addonGUID: string]: AddonID },
  bySlug: { [addonSlug: string]: AddonID },
  loadingBySlug: { [addonSlug: string]: boolean },
|};

export const initialState: AddonsState = {
  byID: {},
  byGUID: {},
  bySlug: {},
  loadingBySlug: {},
};

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
  const addonId = state.addons.bySlug[slug];

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
  return Boolean(state.addons.loadingBySlug[slug]);
};

export const getAllAddons = (state: AppState): Array<AddonType> => {
  const addons = state.addons.byID;

  // $FLOW_FIXME: see https://github.com/facebook/flow/issues/2221.
  return Object.values(addons);
};

type Action =
  | FetchAddonAction
  | LoadAddonsAction
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
          [slug]: true,
        },
      };
    }
    case LOAD_ADDONS:
    case LOAD_ADDON_RESULTS: {
      const { addons: loadedAddons } = action.payload;

      const byID = { ...state.byID };
      const byGUID = { ...state.byGUID };
      const bySlug = { ...state.bySlug };
      const loadingBySlug = { ...state.loadingBySlug };

      Object.keys(loadedAddons).forEach((key) => {
        const addon = createInternalAddon(loadedAddons[key]);
        // Flow wants hash maps with string keys.
        // See: https://zhenyong.github.io/flowtype/docs/objects.html#objects-as-maps
        byID[`${addon.id}`] = addon;

        if (addon.slug) {
          bySlug[addon.slug] = addon.id;
          loadingBySlug[addon.slug] = false;
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
            [addon.slug]: undefined,
          },
          loadingBySlug: {
            ...state.loadingBySlug,
            [addon.slug]: false,
          },
        };
      }
      return state;
    }
    default:
      return state;
  }
}
