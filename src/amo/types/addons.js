/* @flow */
import type {
  VersionIdType,
  ExternalAddonVersionType,
  PartialExternalAddonVersionType,
} from 'amo/reducers/versions';
import type { AddonTypeType, PromotedCategoryType } from 'amo/constants';
import type {
  LocalizedUrlWithOutgoing,
  LocalizedString,
  UrlWithOutgoing,
} from 'amo/types/api';

export type AddonStatusType =
  // This status isn't returned by the AMO API.
  | 'unknown-non-public'
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

export type AddonIconsType = {
  '32'?: string,
  '64'?: string,
  '128'?: string,
};

export type ExternalLanguageToolType = {|
  current_version: ExternalAddonVersionType,
  default_locale: string,
  guid: string,
  id: number,
  locale_disambiguation?: string,
  name: LocalizedString,
  slug: string,
  target_locale: string,
  type: string,
  url: string,
|};

export type LanguageToolType = {|
  ...ExternalLanguageToolType,
  name: string,
|};

export type PromotedType = {|
  category: PromotedCategoryType,
  apps: Array<string>,
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

// A count of add-on ratings per star. These will all be 0 for add-ons
// that have not yet been rated.
export type GroupedRatingsType = {|
  '1': number,
  '2': number,
  '3': number,
  '4': number,
  '5': number,
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
  average_daily_users: number,
  categories?: Object | Array<string>,
  contributions_url: UrlWithOutgoing | null,
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
  homepage: LocalizedUrlWithOutgoing | null,
  icon_url?: string,
  icons?: AddonIconsType,
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
  ratings: {|
    average: number,
    bayesian_average: number,
    count: number,
    grouped_counts: GroupedRatingsType,
    text_count: number,
  |},

  requires_payment?: boolean,
  review_url?: string,
  slug: string,
  status?: AddonStatusType,
  summary?: LocalizedString,
  support_email?: LocalizedString,
  support_url: LocalizedUrlWithOutgoing | null,
  tags: Array<string>,
  target_locale?: string,
  type: AddonTypeType,
  url: string,
  weekly_downloads: number,
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
  homepage: UrlWithOutgoing | null,
  name: string,
  previews?: Array<PreviewType>,
  summary: string | null,
  support_email: string | null,
  support_url: UrlWithOutgoing | null,
  // Here are some custom properties for our internal representation.
  currentVersionId: VersionIdType | null,
  isMozillaSignedExtension: boolean,
  isAndroidCompatible: boolean,
|};

export type CollectionAddonType = {|
  ...AddonType,
  notes: string | null,
|};
