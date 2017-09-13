/* @flow */
import { validAddonTypes } from 'core/constants';

// You have to just laugh at this line!
type AddonTypeType = validAddonTypes;

export type AddonVersionType = {|
  channel: string,
  edit_url: string,
  files: Array<Object>,
  id: number,
  // The `text` property is omitted from addon.current_version.license.
  license: { name: string, url: string },
  reviewed: Date,
  version: string,
|};

export type AddonAuthorType = {|
  name: string,
  url: string,
  username: string,
|};

type ThemeData = {|
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
  authors: Array<AddonAuthorType>,
  average_daily_users: number,
  categories: Object,
  current_beta_version?: AddonVersionType,
  current_version: AddonVersionType,
  default_locale: string,
  description: string,
  edit_url: string,
  guid: string,
  has_eula: boolean,
  has_privacy_policy: boolean,
  homepage?: string,
  icon_url: string,
  id: number,
  is_disabled: boolean,
  is_experimental: boolean,
  is_featured: boolean,
  is_source_public: boolean,
  last_updated: Date,
  latest_unlisted_version: ?AddonVersionType,
  name: string,
  previews: Array<Object>,
  public_stats: boolean,
  ratings: {|
    average: number,
    bayesian_average: number,
    count: number,
  |},
  requires_payment: boolean,
  review_url: string,
  slug: string,
  status:
    | 'beta'
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
    | 'review-pending',
  summary?: string,
  support_email?: string,
  support_url?: string,
  tags: Array<string>,
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
export type AddonType = {
  ...ExternalAddonType,
  ...ThemeData,
  // Here are some custom properties for our internal representation.
  iconUrl: string,
  installURL?: string,
  isRestartRequired: boolean,
};
