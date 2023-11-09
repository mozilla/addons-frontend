/* @flow */
import invariant from 'invariant';

import { callApi } from 'amo/api';
import type { ApiState } from 'amo/reducers/api';
import type { UserId } from 'amo/reducers/users';

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
  addonId: string,
  api: ApiState,
  reporterName: string | null,
  reporterEmail: string | null,
  message: string | null,
  reason: string | null,
  location: string | null,
  addonVersion: string | null,
  auth: boolean,
|};

export type ReportAddonResponse = {|
  addon: {|
    guid: string,
    id: number,
    slug: string,
  |},
  message: string | null,
  reporter: AbuseReporter | null,
  reporter_name: string | null,
  reporter_email: string | null,
  reason: string | null,
  location: string | null,
  addon_version: string | null,
|};

export function reportAddon({
  addonId,
  api,
  reporterName,
  reporterEmail,
  message,
  reason,
  location,
  addonVersion,
  auth,
}: ReportAddonParams): Promise<ReportAddonResponse> {
  return callApi({
    auth,
    endpoint: 'abuse/report/addon',
    method: 'POST',
    body: {
      addon: addonId,
      reporter_email: reporterEmail,
      reporter_name: reporterName,
      message,
      reason,
      location,
      addon_version: addonVersion,
    },
    apiState: api,
  });
}

export type ReportUserParams = {|
  api: ApiState,
  reporterName: string | null,
  reporterEmail: string | null,
  message: string | null,
  reason: string | null,
  userId: UserId,
  auth: boolean,
|};

export type ReportUserResponse = {|
  user: {|
    id: number,
    name: string,
    url: string,
    username: string,
  |},
  message: string | null,
  reporter: AbuseReporter | null,
  reporter_name: string | null,
  reporter_email: string | null,
  reason: string | null,
|};

export function reportUser({
  api,
  message,
  reason,
  reporterEmail,
  reporterName,
  userId,
  auth = true,
}: ReportUserParams): Promise<ReportUserResponse> {
  if (!reason) {
    invariant(
      message?.trim(),
      "message is required when reason isn't specified",
    );
  }

  return callApi({
    auth,
    endpoint: 'abuse/report/user',
    method: 'POST',
    // Using an ID that isn't posted as a string causes a 500 error.
    body: {
      reporter_email: reporterEmail,
      reporter_name: reporterName,
      message,
      reason,
      user: userId.toString(),
    },
    apiState: api,
  });
}
