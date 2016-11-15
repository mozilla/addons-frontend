import { SET_REVIEW } from 'amo/constants';

export const setReview = ({ id, addonId, versionId, rating, userId }) => ({
  type: SET_REVIEW,
  data: {
    id,
    userId,
    addonId,
    versionId,
    rating,
  },
});
