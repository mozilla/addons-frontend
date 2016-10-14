import { SET_REVIEW } from 'amo/constants';

export const setReview = ({ addonId, versionId, rating, userId }) => ({
  type: SET_REVIEW,
  data: {
    userId,
    addonId,
    versionId,
    rating,
  },
});
