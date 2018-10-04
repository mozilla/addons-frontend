import config from 'config';

import { callApi } from 'core/api';

export function getDiscoveryAddons({ api, taarParams = {}, _config = config }) {
  const discoParamsToUse = _config.get('discoParamsToUse');
  const allowedTaarParams = Object.keys(taarParams).reduce((object, key) => {
    if (discoParamsToUse.includes(key)) {
      return { ...object, [key]: taarParams[key] };
    }

    return object;
  }, {});

  // We translate `clientId` to `'telemetry-client-id'`.
  if (allowedTaarParams.clientId) {
    allowedTaarParams['telemetry-client-id'] = allowedTaarParams.clientId;
    delete allowedTaarParams.clientId;
  }

  return callApi({
    endpoint: 'discovery',
    params: allowedTaarParams,
    apiState: api,
  });
}
