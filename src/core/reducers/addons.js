/* @flow */
import { ADDON_TYPE_THEME } from 'core/constants';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { AddonType } from 'core/types/addons';


export const FETCH_ADDON = 'FETCH_ADDON';

const initialState = {};

// TODO: fix Flow types
type Action = Object;
type AddonState = Object;

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

// TODO: merge this into flattenApiAddon
export function getGuid(result: AddonType) {
  if (result.type === ADDON_TYPE_THEME) {
    // This mimics how Firefox appends @personas.mozilla.org internally.
    // It's needed to look up themes in mozAddonManager.
    return `${result.id}@personas.mozilla.org`;
  }
  return result.guid;
}

export function removeUndefinedProps(object) {
  const newObject = {};
  Object.keys(object).forEach((key) => {
    if (typeof object[key] !== 'undefined') {
      newObject[key] = object[key];
    }
  });
  return newObject;
}

// TODO: make APIAddonType for Flow
export function flattenApiAddon(apiAddon: AddonType) {
  // TODO: remove unused fields.
  let addon = {
    authors: apiAddon.authors,
    average_daily_users: apiAddon.average_daily_users,
    categories: apiAddon.categories,
    current_beta_version: apiAddon.current_beta_version,
    current_version: apiAddon.current_version,
    description: apiAddon.description,
    default_locale: apiAddon.default_locale,
    edit_url: apiAddon.edit_url,
    guid: getGuid(apiAddon),
    has_eula: apiAddon.has_eula,
    has_privacy_policy: apiAddon.has_privacy_policy,
    homepage: apiAddon.homepage,
    id: apiAddon.id,
    icon_url: apiAddon.icon_url,
    is_disabled: apiAddon.is_disabled,
    is_experimental: apiAddon.is_experimental,
    is_featured: apiAddon.is_featured,
    is_source_public: apiAddon.is_source_public,
    last_udpated: apiAddon.last_udpated,
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
    addon = {
      ...addon,
      // TODO: fix this to support multiple platforms.
      // https://github.com/mozilla/addons-frontend/issues/2998
      installURL: apiAddon.current_version.files[0].url || '',
      isRestartRequired: apiAddon.current_version.files.some(
        (file) => !!file.is_restart_required
      ),
    };
  }

  // TODO: remove this if possible. It was added by mistake.
  addon.iconUrl = addon.icon_url;

  // Remove undefined properties entirely. This is for some legacy code
  // in Discopane that relies on spreads to combine a Discopane result
  // (which has a header and description) with a minimal add-on object.
  // For example, the minimal add-on object does not have a description
  // property; the spread should not override `description`.
  addon = removeUndefinedProps(addon);

  return addon;
}

export default function addonsReducer(
  state: AddonState = initialState,
  action: Action = {}
) {
  const { payload } = action;

  if (payload && payload.entities && payload.entities.addons) {
    const newState = { ...state };
    Object.keys(payload.entities.addons).forEach((key) => {
      newState[key] = flattenApiAddon(payload.entities.addons[key]);
    });
    return newState;
  }
  return state;
}
