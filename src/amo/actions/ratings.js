/* eslint-disable import/prefer-default-export */
import { SET_USER_RATING } from 'amo/constants';

export const setUserRating = ({ addonId, versionId, rating, userId }) => ({
  type: SET_USER_RATING,
  data: {
    userId,
    addonId,
    versionId,
    rating,
  },
});
