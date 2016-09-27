/* eslint-disable import/prefer-default-export */
import { callApi } from 'core/api';
import log from 'core/logger';

export function postRating({ rating, apiState, addonId, versionID }) {
  const postData = { rating, version: versionID };
  log.debug('about to post add-on rating with', postData);
  return callApi({
    endpoint: `addons/addon/${addonId}/reviews`,
    body: postData,
    method: 'post',
    auth: true,
    state: apiState,
  });
}
