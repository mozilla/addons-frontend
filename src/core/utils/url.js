/* @flow */
import url from 'url';

// TODO: move this function in `index.js` if possible. It was moved from
// `core/utils/addons` to here in order to avoid a weird import error, but it
// does not really belong to `core/utils/addons` or `core/utils/url` either. It
// should be put in `core/utils/index` once the file is converted to Flow.
export function removeUndefinedProps(object: Object): Object {
  const newObject = {};
  Object.keys(object).forEach((key) => {
    if (typeof object[key] !== 'undefined') {
      newObject[key] = object[key];
    }
  });
  return newObject;
}

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
