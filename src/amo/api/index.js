/* eslint-disable import/prefer-default-export */
import { callApi } from 'core/api';
import log from 'core/logger';

export function postRating({ rating, apiState, addonId, versionId }) {
  const postData = { rating, version: versionId };
  log.debug('about to post add-on rating with', postData);
  return callApi({
    endpoint: `addons/addon/${addonId}/reviews`,
    body: postData,
    method: 'post',
    auth: true,
    state: apiState,
  });
}
