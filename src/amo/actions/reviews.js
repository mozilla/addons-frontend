/* @flow */
import { SET_ADDON_REVIEWS, SET_REVIEW } from 'amo/constants';
import type { ApiReviewType } from 'amo/api';

export type UserReviewType = {|
  addonId: number,
  addonSlug: string,
  body?: string,
  created: Date,
  id: number,
  isLatest: boolean,
  rating: number,
  title: string,
  userId: number,
  userName: string,
  userUrl: string,
  versionId: ?number,
|};

export function denormalizeReview(review: ApiReviewType): UserReviewType {
  return {
    addonId: review.addon.id,
    addonSlug: review.addon.slug,
    body: review.body,
    created: review.created,
    id: review.id,
    isLatest: review.is_latest,
    rating: review.rating,
    title: review.title,
    userId: review.user.id,
    userName: review.user.name,
    userUrl: review.user.url,
    // TODO: Figure out why version could be null and/or plan for it.
    versionId: review.version && review.version.id,
  };
}

export type SetReviewAction = {|
  type: string,
  payload: UserReviewType,
|};

export const setReview = (review: ApiReviewType): SetReviewAction => {
  if (!review) {
    throw new Error('review cannot be empty');
  }
  return { type: SET_REVIEW, payload: denormalizeReview(review) };
};

export const setDenormalizedReview = (
  review: UserReviewType
): SetReviewAction => {
  if (!review) {
    throw new Error('review cannot be empty');
  }
  return { type: SET_REVIEW, payload: review };
};

export type SetReviewsAction = {|
  type: string,
  payload: {|
    addonSlug: string,
    reviewCount: number,
    reviews: Array<UserReviewType>,
  |},
|};

type SetReviewsParams = {|
  addonSlug: string,
  reviewCount: number,
  reviews: Array<ApiReviewType>,
|};

export const setReviews = (
  { addonSlug, reviewCount, reviews }: SetReviewsParams
): SetReviewsAction => {
  if (!addonSlug) {
    throw new Error('addonSlug cannot be empty');
  }
  if (!Array.isArray(reviews)) {
    throw new Error('reviews must be an Array');
  }
  if (typeof reviewCount === 'undefined') {
    throw new Error('reviewCount must be set');
  }
  return {
    type: SET_ADDON_REVIEWS,
    payload: {
      addonSlug,
      reviewCount,
      reviews: reviews.map((review) => denormalizeReview(review)),
    },
  };
};
