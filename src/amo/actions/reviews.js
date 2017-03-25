import { SET_ADDON_REVIEWS, SET_REVIEW } from 'amo/constants';

export type UserReviewType = {|
  addonId: number,
  addonSlug: string,
  body: string,
  created: Date,
  title: string,
  id: number,
  isLatest: boolean,
  rating: number,
  userId: number,
  userName: string,
  userUrl: string,
  versionId: number,
|};

export function denormalizeReview(review: Object): UserReviewType {
  return {
    addonId: review.addon.id,
    addonSlug: review.addon.slug,
    body: review.body,
    created: review.created,
    title: review.title,
    id: review.id,
    isLatest: review.is_latest,
    rating: review.rating,
    userId: review.user.id,
    userName: review.user.name,
    userUrl: review.user.url,
    // TODO: Figure out why version could be null and/or plan for it.
    versionId: review.version && review.version.id,
  };
}

const setReviewAction = (review) => ({ type: SET_REVIEW, payload: review });

export const setReview = (review, reviewOverrides = {}) => {
  if (!review) {
    throw new Error('review cannot be empty');
  }
  return setReviewAction({
    ...denormalizeReview(review),
    ...reviewOverrides,
  });
};

export const setDenormalizedReview = (review) => {
  if (!review) {
    throw new Error('review cannot be empty');
  }
  return setReviewAction(review);
};

export const setAddonReviews = ({ addonSlug, reviews }) => {
  if (!addonSlug) {
    throw new Error('addonSlug cannot be empty');
  }
  if (!Array.isArray(reviews)) {
    throw new Error('reviews must be an Array');
  }
  return {
    type: SET_ADDON_REVIEWS,
    payload: {
      addonSlug,
      reviews: reviews.map((review) => denormalizeReview(review)),
    },
  };
};
