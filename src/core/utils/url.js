/* @flow */
import url from 'url';

import type { ReactRouterLocationType } from 'core/types/router';

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
  queryParams: { [key: string]: string } = {},
): string {
  const urlObj = url.parse(urlString, true);
  // Clear search, since query object will only be used if search property
  // doesn't exist.
  urlObj.search = null;
  // $FlowFixMe: I'm not sure why Flow won't accept this.
  urlObj.query = removeUndefinedProps({
    ...urlObj.query,
    ...queryParams,
  });

  return url.format(urlObj);
}

export function getQueryParametersForAttribution(
  location: ReactRouterLocationType,
): Object {
  return {
    utm_campaign: location.query.utm_campaign,
    utm_content: location.query.utm_content,
    utm_medium: location.query.utm_medium,
    utm_source: location.query.utm_source,
  };
}
