import { Schema, arrayOf } from 'normalizr';

import { callApi } from 'core/api';

export function getGuid(result) {
  if (result.type === 'persona') {
    return `${result.id}@personas.mozilla.org`;
  }
  return result.guid;
}

export const discoResult =
  new Schema('discoResults', {idAttribute: (result) => getGuid(result.addon)});
export const addon = new Schema('addons', {idAttribute: getGuid});
discoResult.addon = addon;

export function getDiscoveryAddons({ api }) {
  return callApi({
    endpoint: 'discovery',
    schema: {results: arrayOf(discoResult)},
    state: api,
  });
}
