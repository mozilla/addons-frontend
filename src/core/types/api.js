/* @flow */

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

/*
 * A generic, paginated API response.
 *
 * See http://addons-server.readthedocs.io/en/latest/topics/api/overview.html#pagination
 */
export type PaginatedApiResponse<ResultType> = {|
  count: number,
  next?: string, // URL of the next page
  page_size: number,
  previous?: string, // URL of the previous page
  results: Array<ResultType>,
|};

/*
 * A localized string object, as accepted by API endpoints.
 *
 * Examples: https://addons-server.readthedocs.io/en/latest/topics/api/overview.html#api-overview-translations
 */
export type LocalizedString = {
  [locale: string]: string,
};
