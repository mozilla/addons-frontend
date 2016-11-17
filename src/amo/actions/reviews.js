import { SET_REVIEW } from 'amo/constants';

export const setReview = (review, reviewOverrides = {}) => ({
  type: SET_REVIEW,
  data: {
    id: review.id,
    addonId: review.addon.id,
    rating: review.rating,
    versionId: review.version.id,
    isLatest: review.is_latest,
    userId: review.user.id,
    ...reviewOverrides,
  },
});
