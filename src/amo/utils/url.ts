import url from 'url';

import type { ReactRouterLocationType } from 'amo/types/router';
// TODO: move this function in `index.js` if possible. It was moved from
// `amo/utils/addons` to here in order to avoid a weird import error, but it
// does not really belong to `amo/utils/addons` or `amo/utils/url` either. It
// should be put in `amo/utils/index` once the file is converted to Flow.
export function removeUndefinedProps(object: Record<string, any>): Record<string, any> {
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
export function addQueryParams(urlString: string, queryParams: Record<string, string> = {}): string {
  const urlObj = url.parse(urlString, true);
  // Clear search, since query object will only be used if search property
  // doesn't exist.
  urlObj.search = null;
  // $FlowFixMe: I'm not sure why Flow won't accept this.
  urlObj.query = removeUndefinedProps({ ...urlObj.query,
    ...queryParams,
  });
  return url.format(urlObj);
}
export function getQueryParametersForAttribution(location: ReactRouterLocationType): Record<string, any> {
  return {
    utm_campaign: location.query.utm_campaign,
    utm_content: location.query.utm_content,
    utm_medium: location.query.utm_medium,
    utm_source: location.query.utm_source,
  };
}