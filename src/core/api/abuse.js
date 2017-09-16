/* @flow */
import { callApi } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';


export type ReportAddonParams = {|
  addon: string, // id/guid/slug
  api: ApiStateType,
  auth: boolean,
  message: string,
|};

export function reportAddon(
  { addon, api, auth = false, message }: ReportAddonParams
) {
  return callApi({
    auth,
    endpoint: 'abuse/report/addon',
    method: 'POST',
    params: { addon, message },
    state: api,
  });
}
