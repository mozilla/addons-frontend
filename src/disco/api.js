import { Schema, arrayOf } from 'normalizr';

import { callApi } from 'core/api';
import { getGuid } from 'core/reducers/addons';

export const discoResult =
  new Schema('discoResults', { idAttribute: (result) => getGuid(result.addon) });
export const addon = new Schema('addons', { idAttribute: getGuid });
discoResult.addon = addon;

export function getDiscoveryAddons({ api }) {
  return callApi({
    endpoint: 'discovery',
    schema: { results: arrayOf(discoResult) },
    state: api,
  });
}
