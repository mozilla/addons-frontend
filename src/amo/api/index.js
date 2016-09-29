/* eslint-disable import/prefer-default-export */
import { callApi } from 'core/api';
import log from 'core/logger';

export function postRating({
  rating, apiState, addonId, versionId, body, reviewId,
}) {
  const data = { rating, version: versionId, body };
  log.debug('about to post add-on rating with', data);

  if (!addonId) {
    throw new Error('addonId is required to build the endpoint');
  }
  let method = 'POST';
  let endpoint = `addons/addon/${addonId}/reviews`;
  if (reviewId) {
    endpoint = `${endpoint}/${reviewId}`;
    method = 'PATCH';
  }

  return callApi({
    endpoint,
    body: data,
    method,
    auth: true,
    state: apiState,
  });
}
