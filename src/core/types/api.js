/* @flow */

/*
 * A generic, paginated API response.
 *
 * See http://addons-server.readthedocs.io/en/latest/topics/api/overview.html#pagination
 */
export type PaginatedApiResponse<ResultType> = {|
  count: number,
  next?: string, // URL of the next page
  page_size: string,
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

export type OutgoingUrl = {|
  outgoing: string,
  url: string,
|};

export type LocalizedOutgoingUrl = {
  outgoing: LocalizedString,
  url: LocalizedString,
};
