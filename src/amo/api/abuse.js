/* @flow */
import { callApi } from 'amo/api';
import type { ApiState } from 'amo/reducers/api';

/*
 * A reporter object, returned by Abuse Report APIs
 *
 * A few fields from a user, examples:
 *   * https://addons-server.readthedocs.io/en/latest/topics/api/abuse.html#post--api-v3-abuse-report-addon-
 *   * https://addons-server.readthedocs.io/en/latest/topics/api/abuse.html#post--api-v3-abuse-report-user-
 *
 * Can be `null` if the report was created by an anonymous (eg. not
 * authenticated) user.
 */
export type AbuseReporter = {|
  id: number,
  name: string,
  url: string,
  username: string,
|} | null;

export type ReportAddonParams = {|
  addonSlug: string,
  api: ApiState,
  message: string,
|};

export function reportAddon({
  addonSlug,
  api,
  message,
}: ReportAddonParams): Promise<any> {
  return callApi({
    auth: true,
    endpoint: 'abuse/report/addon',
    method: 'POST',
    body: { addon: addonSlug, message },
    apiState: api,
  });
}

export type ReportUserParams = {|
  api: ApiState,
  message: string,
  userId: number,
|};

export type ReportUserResponse = {|
  message: string,
  reporter: AbuseReporter,
  user: {|
    id: number,
    name: string,
    url: string,
    username: string,
  |},
|};

export function reportUser({
  api,
  message,
  userId,
}: ReportUserParams): Promise<ReportUserResponse> {
  return callApi({
    auth: true,
    endpoint: 'abuse/report/user',
    method: 'POST',
    // Using an ID that isn't posted as a string causes a 500 error.
    body: { message, user: userId.toString() },
    apiState: api,
  });
}
