/* @flow */

type QueryParams = { [queryParam: string]: string | number };

type PushParams = {|
  pathname: string,
  query: QueryParams,
|};

export type ReactRouterLocationType = {|
  action: 'POP' | 'PUSH',
  hash: string, // e.g. #some-anchor
  key: string,
  pathname: string, // e.g. /en-US/firefox/addon/tab-mix-plus/reviews/
  // This is a parsed representation of the query string in object form, it is
  // added by the `addQueryParamsToHistory()` helper in `core/utils`.
  query: QueryParams,
  search: string, // e.g. ?q=search-string
  state?: Object,
|};

export type ReactRouterHistoryType = {|
  goBack: () => void,
  listen: () => void,
  location: ReactRouterLocationType,
  push: (pushURL: string | PushParams) => void,
|};

export type ReactRouterMatchType = {|
  isExact: boolean,
  params: Object,
  path: string,
  url: string,
|};
