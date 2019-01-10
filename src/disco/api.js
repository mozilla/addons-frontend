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

  // We translate `taarId` to `'telemetry-client-id'`.
  if (allowedTaarParams.taarId) {
    allowedTaarParams['telemetry-client-id'] = allowedTaarParams.taarId;
    delete allowedTaarParams.taarId;
  }

  return callApi({
    endpoint: 'discovery',
    params: allowedTaarParams,
    apiState: api,
  });
}
