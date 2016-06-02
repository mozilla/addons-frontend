import { Schema, arrayOf } from 'normalizr';

import { addon, callApi } from 'core/api';

export const discoResult = new Schema('discoResults', {idAttribute: (result) => result.addon.slug});
discoResult.addon = addon;


export function getDiscoveryAddons({ api }) {
  return callApi({
    endpoint: 'discovery',
    schema: {results: arrayOf(discoResult)},
    state: api,
  });
}
