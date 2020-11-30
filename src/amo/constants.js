/* @flow */
export const REVIEW_FLAG_REASON_SPAM: 'review_flag_reason_spam' =
  'review_flag_reason_spam';
export const REVIEW_FLAG_REASON_LANGUAGE: 'review_flag_reason_language' =
  'review_flag_reason_language';
export const REVIEW_FLAG_REASON_BUG_SUPPORT: 'review_flag_reason_bug_support' =
  'review_flag_reason_bug_support';
export const REVIEW_FLAG_REASON_OTHER: 'review_flag_reason_other' =
  'review_flag_reason_other';

export type FlagReviewReasonType =
  | typeof REVIEW_FLAG_REASON_SPAM
  | typeof REVIEW_FLAG_REASON_LANGUAGE
  | typeof REVIEW_FLAG_REASON_BUG_SUPPORT
  | typeof REVIEW_FLAG_REASON_OTHER;

// Number of add-ons in the recommended, trending, and highest rated landing page
// sections, as well as the promoted shelf.
export const LANDING_PAGE_EXTENSION_COUNT = 4;
export const LANDING_PAGE_THEME_COUNT = 3;
export const LANDING_PAGE_PROMOTED_EXTENSION_COUNT = 6;
export const MOBILE_HOME_PAGE_EXTENSION_COUNT = 10;

export const DOWNLOAD_FIREFOX_BASE_URL = 'https://www.mozilla.org/firefox/new/';
export const PROMOTED_ADDONS_SUMO_URL =
  'https://support.mozilla.org/kb/add-on-badges';
