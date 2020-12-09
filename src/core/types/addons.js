/* @flow */
import type {
  VersionIdType,
  ExternalAddonVersionType,
  PartialExternalAddonVersionType,
} from 'core/reducers/versions';
import type { AddonTypeType, PromotedCategoryType } from 'core/constants';
import type { LocalizedString } from 'core/types/api';

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
  name: LocalizedString,
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

export type ExternalPreviewType = {|
  caption: LocalizedString | null,
  image_size: [number, number],
  image_url: string,
  thumbnail_size: [number, number],
  thumbnail_url: string,
|};

export type PreviewType = {|
  // These property names are the ones expected by the PhotoSwipeGallery
  // component, which is why they are less than friendly.
  h: number,
  src: string,
  thumbnail_h: number,
  thumbnail_src: string,
  thumbnail_w: number,
  title: string,
  w: number,
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
  description?: LocalizedString,
  developer_comments?: LocalizedString,
  edit_url?: string,
  guid: string,
  has_eula?: boolean,
  has_privacy_policy?: boolean,
  homepage?: LocalizedString,
  icon_url?: string,
  id: number,
  is_disabled?: boolean,
  is_experimental?: boolean,
  is_source_public?: boolean,
  last_updated: Date | null,
  latest_unlisted_version?: ?ExternalAddonVersionType,
  locale_disambiguation?: string,
  name: LocalizedString,
  previews?: Array<ExternalPreviewType>,
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
  summary?: LocalizedString,
  support_email?: LocalizedString,
  support_url?: LocalizedString,
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
  // normalized l10n fields
  description: string | null,
  developer_comments: string | null,
  homepage: string | null,
  name: string,
  previews?: Array<PreviewType>,
  summary: string | null,
  support_email: string | null,
  support_url: string | null,
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
