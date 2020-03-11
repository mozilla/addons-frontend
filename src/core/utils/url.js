/* @flow */
import url from 'url';

import { removeUndefinedProps } from 'core/utils/addons';

/**
 * Returns a new URL with query params appended to `urlString`.
 *
 * Note: undefined query parameters will be omitted.
 */
export function addQueryParams(
  urlString: string,
  queryParams: { [key: string]: ?string | number } = {},
): string {
  const urlObj = url.parse(urlString, true);
  // Clear search, since query object will only be used if search property
  // doesn't exist.
  urlObj.search = undefined;
  urlObj.query = removeUndefinedProps({ ...urlObj.query, ...queryParams });
  return url.format(urlObj);
}
