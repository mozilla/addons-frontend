/* @flow */
import type { AddonTypeType } from 'core/constants';

type AddonStatus =
  | 'lite'
  | 'public'
  | 'deleted'
  | 'pending'
  | 'disabled'
  | 'rejected'
  | 'nominated'
  | 'incomplete'
  | 'unreviewed'
  | 'lite-nominated'
  | 'review-pending';

export type AddonFileType = {|
  created: string,
  hash: string,
  id: number,
  is_mozilla_signed_extension: boolean,
  is_restart_required: boolean,
  is_webextension: boolean,
  permissions?: Array<string>,
  platform: 'all' | 'android' | 'mac' | 'linux' | 'windows',
  size: number,
  status: AddonStatus,
  url: string,
|};

export type AddonCompatibilityType = {|
  [appName: string]: {|
    min: string,
    max: string,
  |},
|};

type PartialExternalAddonVersionType = {|
  channel: string,
  compatibility?: AddonCompatibilityType,
  edit_url: string,
  files: Array<AddonFileType>,
  id: number,
  reviewed: Date,
  // This is the developer-defined version number.
  // It could, for example, be set to "0".
  // See:
  // https://github.com/mozilla/addons-frontend/pull/3271#discussion_r142159199
  version: string,
|};

export type ExternalAddonVersionType = {|
  ...PartialExternalAddonVersionType,
  // The `text` property is omitted from addon.current_version.license.
  license: { name: string, url: string },
  release_notes?: string,
|};

type PartialAddonAuthorType = {|
  id: number,
  name: string,
  url: string,
  username: string,
|};

export type AddonAuthorType = {|
  ...PartialAddonAuthorType,
  picture_url: string,
|};

export type LanguageToolType = {|
  current_version: ExternalAddonVersionType,
  default_locale: string,
  guid: string,
  id: number,
  locale_disambiguation?: string,
  name: string,
  slug: string,
  target_locale?: string,
  type: string,
  url: string,
|};

export type ThemeData = {|
  accentcolor?: string,
  author?: string,
  category?: string,
  description?: string,
  detailURL?: string,
  footer?: string,
  footerURL?: string,
  header?: string,
  headerURL?: string,
  iconURL?: string,
  id?: number,
  name?: string,
  previewURL?: string,
  textcolor?: string,
  updateURL?: string,
  version?: string,
|};

/*
 * This is the external API representation of an add-on.
 *
 * This is a detailed API response. Not all API responses which return
 * add-ons will include this amount of detail.
 *
 * See: https://addons-server.readthedocs.io/en/latest/topics/api/addons.html#detail
 */
export type ExternalAddonType = {|
  authors?: Array<AddonAuthorType>,
  average_daily_users?: number,
  categories?: Object,
  contributions_url?: string,
  // If you make an API request as an admin for an incomplete
  // add-on (status=0) then the current_version could be null.
  current_version?: ExternalAddonVersionType,
  default_locale: string,
  description?: string,
  edit_url?: string,
  guid: string,
  has_eula?: boolean,
  has_privacy_policy?: boolean,
  homepage?: string,
  icon_url?: string,
  id: number,
  is_disabled?: boolean,
  is_experimental?: boolean,
  is_featured?: boolean,
  is_source_public?: boolean,
  last_updated: Date | null,
  latest_unlisted_version?: ?ExternalAddonVersionType,
  locale_disambiguation?: string,
  name: string,
  previews?: Array<Object>,
  public_stats?: boolean,
  ratings?: {|
    average: number,
    bayesian_average: number,
    count: number,
    text_count: number,
  |},
  requires_payment?: boolean,
  review_url?: string,
  slug: string,
  status?: AddonStatus,
  summary?: string,
  support_email?: string,
  support_url?: string,
  tags?: Array<string>,
  target_locale?: string,
  theme_data?: ThemeData,
  type: AddonTypeType,
  url: string,
  weekly_downloads: number,
|};

/*
 * This is our internal representation of an add-on, found in Redux state.
 *
 * TODO: for better protection, turn this into an Exact Type. This is
 * not currently possible because of:
 * https://github.com/facebook/flow/issues/4818
 */
export type AddonType = {|
  ...ExternalAddonType,
  ...ThemeData,
  // Here are some custom properties for our internal representation.
  platformFiles: {|
    // This seems necessary to help Flow know that computed
    // keys always return an AddonFileType.
    [anyPlatform: string]: ?AddonFileType,
    all: ?AddonFileType,
    android: ?AddonFileType,
    mac: ?AddonFileType,
    linux: ?AddonFileType,
    windows: ?AddonFileType,
  |},
  isMozillaSignedExtension: boolean,
  isRestartRequired: boolean,
  isWebExtension: boolean,
  themeData?: ThemeData,
|};

export type CollectionAddonType = {|
  ...AddonType,
  notes: string | null,
|};

export type SearchResultAddonType = {|
  ...AddonType,
  authors?: Array<PartialAddonAuthorType>,
  current_version?: PartialExternalAddonVersionType,
|};
