/* @flow */
// Action types.
export const CLEAR_ADDON_REVIEWS: 'CLEAR_ADDON_REVIEWS' = 'CLEAR_ADDON_REVIEWS';
export const SHOW_EDIT_REVIEW_FORM: 'SHOW_EDIT_REVIEW_FORM' =
  'SHOW_EDIT_REVIEW_FORM';
export const SHOW_REPLY_TO_REVIEW_FORM: 'SHOW_REPLY_TO_REVIEW_FORM' =
  'SHOW_REPLY_TO_REVIEW_FORM';
export const FETCH_REVIEWS: 'FETCH_REVIEWS' = 'FETCH_REVIEWS';
export const FETCH_USER_REVIEWS: 'FETCH_USER_REVIEWS' = 'FETCH_USER_REVIEWS';
export const HIDE_EDIT_REVIEW_FORM: 'HIDE_EDIT_REVIEW_FORM' =
  'HIDE_EDIT_REVIEW_FORM';
export const HIDE_REPLY_TO_REVIEW_FORM: 'HIDE_REPLY_TO_REVIEW_FORM' =
  'HIDE_REPLY_TO_REVIEW_FORM';
export const SET_ADDON_REVIEWS: 'SET_ADDON_REVIEWS' = 'SET_ADDON_REVIEWS';
export const SET_USER_REVIEWS: 'SET_USER_REVIEWS' = 'SET_USER_REVIEWS';
export const SET_REVIEW: 'SET_REVIEW' = 'SET_REVIEW';
export const SET_REVIEW_REPLY: 'SET_REVIEW_REPLY' = 'SET_REVIEW_REPLY';
export const SET_REVIEW_WAS_FLAGGED: 'SET_REVIEW_WAS_FLAGGED' =
  'SET_REVIEW_WAS_FLAGGED';
export const SEND_REPLY_TO_REVIEW: 'SEND_REPLY_TO_REVIEW' =
  'SEND_REPLY_TO_REVIEW';
export const SEND_REVIEW_FLAG: 'SEND_REVIEW_FLAG' = 'SEND_REVIEW_FLAG';

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
export const LANDING_PAGE_ADDON_COUNT = 4;
