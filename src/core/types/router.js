/* @flow */

/*
 * This is what the magic location property added by react-router looks like.
 */
export type ReactRouterLocation = {|
  action: 'POP' | 'PUSH',
  hash: string, // e.g. #some-anchor
  key: string,
  pathname: string, // e.g. /en-US/firefox/addon/tab-mix-plus/reviews/
  // This is a parsed representation of the query string in object form.
  query: Object,
  search: string, // e.g. ?q=search-string
  state?: Object,
|};

type pushParams = {|
  pathname: string,
  query: { [param: string]: string | number },
|};

export type ReactRouterType = {|
  location: ReactRouterLocation,
  // These are parameters derived from the <Route/> config.
  params: { [param: string]: string },
  push: (pushURL: string | pushParams) => void,
|};
