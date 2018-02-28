/* @flow */
import { callApi } from 'core/api';
import type { UserType } from 'amo/reducers/users';
import type { ApiStateType } from 'core/reducers/api';


export type ReportAddonParams = {|
  addonSlug: string,
  api: ApiStateType,
  message: string,
|};

export function reportAddon({ addonSlug, api, message }: ReportAddonParams) {
  return callApi({
    auth: true,
    endpoint: 'abuse/report/addon',
    method: 'POST',
    body: { addon: addonSlug, message },
    state: api,
  });
}

export type ReportUserParams = {|
  api: ApiStateType,
  message: string,
  user: UserType,
|};

export function reportUser({ api, message, user }: ReportUserParams) {
  return callApi({
    auth: true,
    endpoint: 'abuse/report/user',
    method: 'POST',
    // Using an ID that isn't posted as a string causes a 500 error.
    body: { message, user: user.id.toString() },
    state: api,
  });
}
