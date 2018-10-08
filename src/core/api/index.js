/* @flow */
/* global fetch */
import url from 'url';

import utf8 from 'utf8';
import { oneLine } from 'common-tags';
import config from 'config';

import languages from 'core/languages';
import { initialApiState } from 'core/reducers/api';
import log from 'core/logger';
import {
  addVersionCompatibilityToFilters,
  convertFiltersToQueryParams,
} from 'core/searchUtils';
import { addQueryParams } from 'core/utils';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { ApiState } from 'core/reducers/api';
import type { LocalizedString, PaginatedApiResponse } from 'core/types/api';
import type { ReactRouterLocationType } from 'core/types/router';

const API_BASE = `${config.get('apiHost')}${config.get('apiPath')}`;

export const DEFAULT_API_PAGE_SIZE = 25;

export function makeQueryString(query: { [key: string]: any }) {
  const resolvedQuery = { ...query };
  Object.keys(resolvedQuery).forEach((key) => {
    const value = resolvedQuery[key];
    if (value === undefined || value === null || value === '') {
      // Make sure we don't turn this into ?key= (empty string) because
      // sending an empty string to the API sometimes triggers bugs.
      delete resolvedQuery[key];
    }
  });
  return url.format({ query: resolvedQuery });
}

type CreateApiErrorParams = {|
  apiURL?: string,
  response: { status: number },
  jsonResponse?: Object,
|};

export function createApiError({
  apiURL,
  response,
  jsonResponse,
}: CreateApiErrorParams) {
  let urlId = '[unknown URL]';
  if (apiURL) {
    // Strip the host since we already know that.
    urlId = apiURL.replace(config.get('apiHost'), '');
    // Strip query string params since lang will vary quite a lot.
    urlId = urlId.split('?')[0];
  }
  const apiError = new Error(
    `Error calling: ${urlId} (status: ${response.status})`,
  );
  // $FLOW_FIXME: turn Error into a custom ApiError class.
  apiError.response = {
    apiURL,
    status: response.status,
    data: jsonResponse,
  };
  return apiError;
}

type CallApiParams = {|
  apiState?: ApiState,
  auth?: boolean,
  body?: Object | FormData,
  credentials?: boolean,
  endpoint: string,
  errorHandler?: ErrorHandlerType,
  method?: 'GET' | 'POST' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PUT' | 'PATCH',
  params?: Object,
  _config?: typeof config,
  version?: string,
  _log?: typeof log,
|};

export function callApi({
  endpoint,
  params = {},
  auth = false,
  apiState = initialApiState,
  method = 'GET',
  body,
  credentials,
  errorHandler,
  _config = config,
  version = _config.get('apiVersion'),
  _log = log,
}: CallApiParams): Promise<any> {
  if (!endpoint) {
    return Promise.reject(
      new Error(`endpoint URL cannot be falsy: "${endpoint}"`),
    );
  }
  if (errorHandler) {
    errorHandler.clear();
  }

  const apiPath = `${config.get('apiPath')}${version}`;

  const parsedUrl = url.parse(endpoint, true);
  let adjustedEndpoint = parsedUrl.pathname || '';
  if (!parsedUrl.host) {
    // If it's a relative URL, add the API prefix.
    const slash = !adjustedEndpoint.startsWith('/') ? '/' : '';
    adjustedEndpoint = `${apiPath}${slash}${adjustedEndpoint}`;
  } else if (!adjustedEndpoint.startsWith(apiPath)) {
    // If it's an absolute URL, it must have the correct prefix.
    return Promise.reject(
      new Error(`Absolute URL "${endpoint}" has an unexpected prefix.`),
    );
  }

  // Preserve the original query string if there is one.
  // This might happen when we parse `next` URLs returned by the API.
  const queryString = makeQueryString({
    ...parsedUrl.query,
    ...params,
    lang: apiState.lang,
    // Always return URLs wrapped by the outgoing proxy.
    // Example: http://outgoing.prod.mozaws.net/
    wrap_outgoing_links: true,
  });

  const options = {
    headers: {},
    // Always make sure the method is upper case so that the browser won't
    // complain about CORS problems.
    method: method.toUpperCase(),
    credentials: undefined,
    body: undefined,
  };
  if (credentials) {
    options.credentials = 'include';
  }
  if (body) {
    if (body instanceof FormData) {
      options.body = body;
      // Let the browser sets this header, including the boundary value.
      delete options.headers['Content-type'];
    } else {
      options.body = JSON.stringify(body);
      options.headers['Content-type'] = 'application/json';
    }
  }
  if (auth) {
    if (apiState.token) {
      options.headers.authorization = `Bearer ${apiState.token}`;
    }
  }

  adjustedEndpoint = adjustedEndpoint.endsWith('/')
    ? adjustedEndpoint
    : `${adjustedEndpoint}/`;
  let apiURL = `${config.get('apiHost')}${adjustedEndpoint}${queryString}`;
  if (_config.get('server')) {
    _log.debug('Encoding `apiURL` in UTF8 before fetch().');
    // Workaround for https://github.com/bitinn/node-fetch/issues/245
    apiURL = utf8.encode(apiURL);
  }

  return fetch(apiURL, options)
    .then((response) => {
      // There isn't always a 'Content-Type' in headers, e.g., with a DELETE
      // method or 5xx responses.
      let contentType = response.headers.get('Content-Type');
      contentType = contentType && contentType.toLowerCase();

      // This is a bit paranoid, but we ensure the API returns a JSON response
      // (see https://github.com/mozilla/addons-frontend/issues/1701).
      // If not we'll store the text response in JSON and log an error.
      // If the JSON parsing fails; we log the error and return an "unknown
      // error".
      if (contentType === 'application/json') {
        return response
          .json()
          .then((jsonResponse) => ({ response, jsonResponse }));
      }

      return response.text().then((text) => {
        _log.warn(
          oneLine`Response from API was not JSON (was Content-Type:
            ${contentType || '[unknown]'})`,
          {
            body: text ? text.substring(0, 100) : '[empty]',
            status: response.status || '[unknown]',
            url: response.url || '[unknown]',
          },
        );

        // jsonResponse should be an empty object in this case. Otherwise, its
        // keys could be treated as generic API errors.
        return { jsonResponse: {}, response };
      });
    })
    .then(
      ({ response, jsonResponse }) => {
        if (response.ok) {
          return jsonResponse;
        }

        // If response is not ok we'll throw an error.
        const apiError = createApiError({ apiURL, response, jsonResponse });
        if (errorHandler) {
          errorHandler.handle(apiError);
        }
        throw apiError;
      },
      (fetchError) => {
        // This actually handles the case when the call to fetch() is
        // rejected, say, for a network connection error, etc.
        if (errorHandler) {
          errorHandler.handle(fetchError);
        }
        throw fetchError;
      },
    );
}

export type FetchAddonParams = {|
  api: ApiState,
  slug: string,
|};

export function fetchAddon({ api, slug }: FetchAddonParams) {
  const { clientApp, userAgentInfo } = api;
  const appVersion = userAgentInfo.browser.version;
  if (!appVersion) {
    log.warn(
      `Failed to parse appversion for client app ${clientApp || '[empty]'}`,
    );
  }

  return callApi({
    endpoint: addQueryParams(`addons/addon/${slug}`, {
      app: clientApp,
      appversion: appVersion,
    }),
    auth: true,
    apiState: api,
  });
}

export function startLoginUrl({
  _config = config,
  location,
}: {|
  _config?: typeof config,
  location: ReactRouterLocationType,
|}) {
  const apiVersion = _config.get('apiVersion');
  const configName = _config.get('fxaConfig');

  const params = {
    config: undefined,
    to: url.format({ ...location }),
  };
  if (configName) {
    params.config = configName;
  }
  const query = makeQueryString(params);

  return `${API_BASE}${apiVersion}/accounts/login/start/${query}`;
}

export function categories({ api }: {| api: ApiState |}) {
  return callApi({
    endpoint: 'addons/categories',
    apiState: api,
  });
}

export function logOutFromServer({ api }: {| api: ApiState |}) {
  return callApi({
    auth: true,
    credentials: true,
    endpoint: 'accounts/session',
    method: 'DELETE',
    apiState: api,
  });
}

type AutocompleteParams = {|
  api: ApiState,
  filters: {|
    query: string,
    addonType?: string,
  |},
|};

export function autocomplete({ api, filters }: AutocompleteParams) {
  const filtersWithAppVersion = addVersionCompatibilityToFilters({
    filters,
    userAgentInfo: api.userAgentInfo,
  });

  return callApi({
    endpoint: 'addons/autocomplete',
    params: {
      app: api.clientApp,
      ...convertFiltersToQueryParams(filtersWithAppVersion),
    },
    apiState: api,
  });
}

type GetNextResponseType = (
  nextURL?: string,
) => Promise<PaginatedApiResponse<any>>;

type AllPagesOptions = {| pageLimit: number |};

export const allPages = async (
  getNextResponse: GetNextResponseType,
  { pageLimit = 100 }: AllPagesOptions = {},
): Promise<PaginatedApiResponse<any>> => {
  let results = [];
  let nextURL;
  let count = 0;
  let pageSize = 0;

  for (let page = 1; page <= pageLimit; page++) {
    const response = await getNextResponse(nextURL);
    if (!count) {
      // Every response page returns a count for all results.
      count = response.count;
    }
    if (!pageSize) {
      pageSize = response.page_size;
    }
    results = results.concat(response.results);

    if (response.next) {
      nextURL = response.next;
      log.debug(`Fetching next page "${nextURL}"`);
    } else {
      return { count, page_size: pageSize, results };
    }
  }

  // If we get this far the callback may not be advancing pages correctly.
  throw new Error(`Fetched too many pages (the limit is ${pageLimit})`);
};

export const validateLocalizedString = (localizedString: LocalizedString) => {
  if (typeof localizedString !== 'object') {
    throw new Error(`Expected an object type, got "${typeof localizedString}"`);
  }
  Object.keys(localizedString).forEach((localeKey) => {
    if (typeof languages[localeKey] === 'undefined') {
      throw new Error(`Unknown locale: "${localeKey}"`);
    }
  });
};
