/* @flow */
import { callApi } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';


export type ReportAddonParams = {|
  addonSlug: string,
  api: ApiStateType,
  auth?: boolean,
  message: string,
|};

export function reportAddon(
  { addonSlug, api, auth = false, message }: ReportAddonParams
) {
  return callApi({
    auth,
    endpoint: 'abuse/report/addon',
    method: 'POST',
    params: { addon: addonSlug, message },
    state: api,
  });
}
