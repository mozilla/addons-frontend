/* @flow */
import { callApi } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';


export type ReportAddonParams = {|
  addonSlug: string,
  api: ApiStateType,
  message: string,
|};

export function reportAddon(
  { addonSlug, api, message }: ReportAddonParams
) {
  return callApi({
    auth: true,
    endpoint: 'abuse/report/addon',
    method: 'POST',
    body: { addon: addonSlug, message },
    state: api,
  });
}
