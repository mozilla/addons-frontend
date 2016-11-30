import { SET_REVIEW } from 'amo/constants';

export const setReview = (review, reviewOverrides = {}) => ({
  type: SET_REVIEW,
  payload: {
    addonId: review.addon.id,
    addonSlug: review.addon.slug,
    body: review.body,
    id: review.id,
    isLatest: review.is_latest,
    rating: review.rating,
    userId: review.user.id,
    versionId: review.version.id,
    ...reviewOverrides,
  },
});
