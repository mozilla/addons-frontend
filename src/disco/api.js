import config from 'config';
import { schema } from 'normalizr';

import { callApi } from 'core/api';
import { getGuid } from 'core/reducers/addons';


export const addon = new schema.Entity('addons', {}, { idAttribute: getGuid });
export const discoResult = new schema.Entity(
  'discoResults',
  { addon },
  { idAttribute: (result) => getGuid(result.addon) }
);

export function getDiscoveryAddons({ api, taarParams = {}, _config = config }) {
  const taarParamsToUse = _config.get('taarParamsToUse');
  const allowedTaarParams = Object.keys(taarParams).reduce((object, key) => {
    if (taarParamsToUse.includes(key)) {
      return { ...object, [key]: taarParams[key] };
    }

    return object;
  }, {});

  return callApi({
    endpoint: 'discovery',
    params: allowedTaarParams,
    schema: { results: [discoResult] },
    state: api,
  });
}
