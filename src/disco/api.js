import { schema } from 'normalizr';

import { callApi } from 'core/api';
import { getGuid } from 'core/reducers/addons';


export const addon = new schema.Entity('addons', {}, { idAttribute: getGuid });
export const discoResult = new schema.Entity(
  'discoResults',
  { addon },
  { idAttribute: (result) => getGuid(result.addon) }
);

export function getDiscoveryAddons({ api, platform, telemetryClientId }) {
  return callApi({
    endpoint: 'discovery',
    params: {
      platform,
      'telemetry-client-id': telemetryClientId,
    },
    schema: { results: [discoResult] },
    state: api,
  });
}
