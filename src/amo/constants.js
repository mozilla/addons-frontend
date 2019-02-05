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

// Number of total featured add-ons to load.
export const FEATURED_ADDONS_TO_LOAD = 25;

// Number of add-ons in the featured, trending, and highest rated landing page
// sections.
export const LANDING_PAGE_EXTENSION_COUNT = 4;
export const LANDING_PAGE_THEME_COUNT = 3;

export const DOWNLOAD_FIREFOX_BASE_URL = 'https://www.mozilla.org/firefox/new/';
