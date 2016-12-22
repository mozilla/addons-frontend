import { SET_ADDON_REVIEWS, SET_REVIEW } from 'amo/constants';

function denormalizeReview(review) {
  return {
    addonId: review.addon.id,
    addonSlug: review.addon.slug,
    body: review.body,
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

export const setReview = (review, reviewOverrides = {}) => ({
  type: SET_REVIEW,
  payload: {
    ...denormalizeReview(review),
    ...reviewOverrides,
  },
});

export const setAddonReviews = ({addonSlug, reviews}) => ({
  type: SET_ADDON_REVIEWS,
  payload: {
    addonSlug,
    reviews: reviews.map((review) => denormalizeReview(review)),
  },
});
