/* @flow */
import type {
  VersionIdType,
  ExternalAddonVersionType,
  PartialExternalAddonVersionType,
} from 'core/reducers/versions';
import type { AddonTypeType, PromotedCategoryType } from 'core/constants';

export type AddonStatusType =
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

export type PromotedType = {|
  category: PromotedCategoryType,
  apps: Array<string>,
|};

type EventDataType = {|
  click: string,
  conversion: string,
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
  contributions_url: string,
  created: Date,
  // If you make an API request as an admin for an incomplete
  // add-on (status=0) then the current_version could be null.
  current_version?: ExternalAddonVersionType | PartialExternalAddonVersionType,
  default_locale: string,
  description?: string,
  developer_comments?: string,
  edit_url?: string,
  guid: string,
  has_eula?: boolean,
  has_privacy_policy?: boolean,
  homepage?: string,
  icon_url?: string,
  id: number,
  is_disabled?: boolean,
  is_experimental?: boolean,
  is_source_public?: boolean,
  last_updated: Date | null,
  latest_unlisted_version?: ?ExternalAddonVersionType,
  locale_disambiguation?: string,
  name: string,
  previews?: Array<Object>,
  promoted: PromotedType | null,
  ratings?: {|
    average: number,
    bayesian_average: number,
    count: number,
    text_count: number,
  |},
  requires_payment?: boolean,
  review_url?: string,
  slug: string,
  status?: AddonStatusType,
  summary?: string,
  support_email?: string,
  support_url?: string,
  tags?: Array<string>,
  target_locale?: string,
  type: AddonTypeType,
  url: string,
  weekly_downloads: number,
  // These fields only exist for addons returned from the sponsored endpoint.
  event_data?: EventDataType,
|};

export type PartialExternalAddonType = {|
  ...ExternalAddonType,
  current_version?: PartialExternalAddonVersionType,
|};

/*
 * This is our internal representation of an add-on, found in Redux state.
 */
export type AddonType = {|
  ...ExternalAddonType,
  // Here are some custom properties for our internal representation.
  currentVersionId: VersionIdType | null,
  isMozillaSignedExtension: boolean,
  isRestartRequired: boolean,
  isWebExtension: boolean,
|};

export type CollectionAddonType = {|
  ...AddonType,
  notes: string | null,
|};
