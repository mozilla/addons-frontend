/* @flow */
export type AddonVersionType = {|
  id: number,
  channel: string,
  edit_url: string,
  files: Array<Object>,
  // The `text` property is omitted from addon.current_version.license.
  license: { name: string, url: string },
  reviewed: Date,
  version: string,
|};

export type AddonAuthorType = {|
  name: string,
  url: string,
|};

export type AddonType = {|
  id: number,
  authors: Array<AddonAuthorType>,
  average_daily_users: number,
  categories: Object,
  compatibility: Object,
  current_version: AddonVersionType,
  default_locale: string,
  description: string,
  edit_url: string,
  guid: string,
  has_eula: boolean,
  has_privacy_policy: boolean,
  homepage: string,
  icon_url: string,
  is_disabled: boolean,
  is_experimental: boolean,
  is_source_public: boolean,
  name: string,
  last_updated: Date,
  latest_unlisted_version: ?AddonVersionType,
  previews: Array<Object>,
  public_stats: boolean,
  ratings: {|
    count: number,
    average: number,
  |},
  review_url: string,
  slug: string,
  status: 'beta'
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
  summary: string,
  support_email: string,
  support_url: string,
  tags: Array<string>,
  theme_data: Object,
  type: string,
  url: string,
  weekly_downloads: number,
|};
