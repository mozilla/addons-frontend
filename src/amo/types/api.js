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

export type UrlWithOutgoing = {|
  outgoing: string,
  url: string,
|};

export type LocalizedUrlWithOutgoing = {|
  outgoing: LocalizedString,
  url: LocalizedString,
|};

export type QueryParams = { [param: string]: string | null };
