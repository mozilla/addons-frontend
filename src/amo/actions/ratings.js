/* eslint-disable import/prefer-default-export */
import { SET_USER_RATING } from 'amo/constants';

export const setUserRating = ({ addonId, userRating, userId }) => ({
  type: SET_USER_RATING,
  data: {
    addonId,
    userRating,
    userId,
  },
});
