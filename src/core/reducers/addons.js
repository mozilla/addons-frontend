/* @flow */
import { ADDON_TYPE_THEME } from 'core/constants';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { AddonType, ExternalAddonType } from 'core/types/addons';


export const ADDONS_LOADED = 'ADDONS_LOADED';
export const FETCH_ADDON = 'FETCH_ADDON';

type ExternalAddonMap = {
  [addonSlug: string]: ExternalAddonType,
};

export type LoadAddonsAction = {|
  payload: {| addons: ExternalAddonMap |},
  type: string,
|};

export function loadAddons(
  entities: {| addons?: ExternalAddonMap |}
): LoadAddonsAction {
  if (!entities) {
    throw new Error('the entities parameter cannot be empty');
  }
  return {
    type: ADDONS_LOADED,
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
  type: string,
  payload: {|
    errorHandlerId: string,
    slug: string,
  |},
|};

export function fetchAddon({ errorHandler, slug }: FetchAddonParams): FetchAddonAction {
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

export function flattenApiAddon(apiAddon: ExternalAddonType): AddonType {
  let addon: AddonType = {
    authors: apiAddon.authors,
    average_daily_users: apiAddon.average_daily_users,
    categories: apiAddon.categories,
    current_beta_version: apiAddon.current_beta_version,
    current_version: apiAddon.current_version,
    default_locale: apiAddon.default_locale,
    description: apiAddon.description,
    edit_url: apiAddon.edit_url,
    guid: getGuid(apiAddon),
    has_eula: apiAddon.has_eula,
    has_privacy_policy: apiAddon.has_privacy_policy,
    homepage: apiAddon.homepage,
    icon_url: apiAddon.icon_url,
    // TODO: remove this if possible. I think it was added by mistake
    // but there are some things relying on it :/
    iconUrl: apiAddon.icon_url,
    id: apiAddon.id,
    is_disabled: apiAddon.is_disabled,
    is_experimental: apiAddon.is_experimental,
    is_featured: apiAddon.is_featured,
    is_source_public: apiAddon.is_source_public,
    last_updated: apiAddon.last_updated,
    latest_unlisted_version: apiAddon.latest_unlisted_version,
    name: apiAddon.name,
    previews: apiAddon.previews,
    public_stats: apiAddon.public_stats,
    ratings: apiAddon.ratings || undefined,
    requires_payment: apiAddon.requires_payment,
    review_url: apiAddon.review_url,
    slug: apiAddon.slug,
    status: apiAddon.status,
    summary: apiAddon.summary,
    support_email: apiAddon.support_email,
    support_url: apiAddon.support_url,
    tags: apiAddon.tags,
    type: apiAddon.type,
    url: apiAddon.url,
    weekly_downloads: apiAddon.weekly_downloads,

    // These are custom properties not in the API response.
    isRestartRequired: false,
  };

  if (addon.type === ADDON_TYPE_THEME && apiAddon.theme_data) {
    // Merge in theme_data. This overwrites add-on properties.
    // We should not do this but there are lots of components to
    // fix first.
    addon = {
      ...addon,
      ...removeUndefinedProps({
        accentcolor: apiAddon.theme_data.accentcolor,
        author: apiAddon.theme_data.author,
        category: apiAddon.theme_data.category,
        // TODO: Set this back to apiAddon.theme_data.description after
        // https://github.com/mozilla/addons-frontend/issues/1416
        // is fixed.
        // theme_data will contain `description: 'None'` when the
        // description
        // is actually `null` and we don't want to set that on the addon
        // itself so we reset it in case it's been overwritten.
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
      }),
    };
  }

  if (apiAddon.current_version && apiAddon.current_version.files.length > 0) {
    addon.installURL = apiAddon.current_version.files[0].url || '';
    addon.isRestartRequired = apiAddon.current_version.files.some(
      (file) => !!file.is_restart_required
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

const initialState = {};

type AddonState = {
  [addonSlug: string]: AddonType,
};

export default function addonsReducer(
  state: AddonState = initialState,
  action: LoadAddonsAction
) {
  switch (action.type) {
    case ADDONS_LOADED: {
      const { addons } = action.payload;
      const newState = { ...state };
      Object.keys(addons).forEach((key) => {
        newState[key] = flattenApiAddon(addons[key]);
      });
      return newState;
    }
    default:
      return state;
  }
}
