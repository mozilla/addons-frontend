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
  message: string,
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
      lang: api.lang,
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
  message: string,
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
    body: {
      user: userId,
      message,
      reason,
      reporter_email: reporterEmail,
      reporter_name: reporterName,
      lang: api.lang,
    },
    apiState: api,
  });
}

export type ReportRatingParams = {|
  api: ApiState,
  ratingId: number,
  message: string | null,
  reason: string | null,
  reporterName: string | null,
  reporterEmail: string | null,
  auth: boolean,
|};

export type ReportRatingResponse = {|
  reporter: AbuseReporter | null,
  reporter_name: string | null,
  reporter_email: string | null,
  rating: {|
    id: number,
  |},
  message: string,
  reason: string | null,
|};

// See: https://addons-server.readthedocs.io/en/latest/topics/api/abuse.html#submitting-a-rating-abuse-report
export function reportRating({
  api,
  ratingId,
  message,
  reason,
  reporterName,
  reporterEmail,
  auth,
}: ReportRatingParams): Promise<ReportRatingResponse> {
  if (!reason) {
    invariant(
      message?.trim(),
      "message is required when reason isn't specified",
    );
  }

  return callApi({
    auth,
    endpoint: 'abuse/report/rating',
    method: 'POST',
    body: {
      rating: ratingId,
      message,
      reason,
      reporter_name: reporterName,
      reporter_email: reporterEmail,
      lang: api.lang,
    },
    apiState: api,
  });
}

export type ReportCollectionParams = {|
  api: ApiState,
  collectionId: number,
  message: string | null,
  reason: string | null,
  reporterName: string | null,
  reporterEmail: string | null,
  auth: boolean,
|};

export type ReportCollectionResponse = {|
  reporter: AbuseReporter | null,
  reporter_name: string | null,
  reporter_email: string | null,
  collection: {|
    id: number,
  |},
  message: string,
  reason: string | null,
|};

// See: https://addons-server.readthedocs.io/en/latest/topics/api/abuse.html#submitting-a-collection-abuse-report
export function reportCollection({
  api,
  collectionId,
  message,
  reason,
  reporterName,
  reporterEmail,
  auth,
}: ReportCollectionParams): Promise<ReportCollectionResponse> {
  if (!reason) {
    invariant(
      message?.trim(),
      "message is required when reason isn't specified",
    );
  }

  return callApi({
    auth,
    endpoint: 'abuse/report/collection',
    method: 'POST',
    body: {
      collection: collectionId,
      message,
      reason,
      reporter_name: reporterName,
      reporter_email: reporterEmail,
      lang: api.lang,
    },
    apiState: api,
  });
}
