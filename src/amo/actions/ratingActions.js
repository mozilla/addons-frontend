/* eslint-disable import/prefer-default-export */
import { SET_USER_RATING } from 'amo/constants';

export const setUserRating = ({ addonID, userRating }) => ({
  type: SET_USER_RATING,
  data: {
    addonID,
    userRating,
  },
});
