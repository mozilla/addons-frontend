/* @flow */
/* global fetch */
import url from 'url';

import utf8 from 'utf8';
import 'isomorphic-fetch';
import { schema as normalizrSchema, normalize } from 'normalizr';
import { oneLine } from 'common-tags';
import config from 'config';

import languages from 'core/languages';
import { initialApiState } from 'core/reducers/api';
import log from 'core/logger';
import {
  addVersionCompatibilityToFilters,
  convertFiltersToQueryParams,
} from 'core/searchUtils';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { ApiStateType } from 'core/reducers/api';
import type { LocalizedString, PaginatedApiResponse } from 'core/types/api';
import type { ReactRouterLocation } from 'core/types/router';


const API_BASE = `${config.get('apiHost')}${config.get('apiPath')}`;
const { Entity } = normalizrSchema;

export const addon = new Entity('addons', {}, { idAttribute: 'slug' });
export const category = new Entity('categories', {}, { idAttribute: 'slug' });

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

export function createApiError(
  { apiURL, response, jsonResponse }: CreateApiErrorParams
) {
  let urlId = '[unknown URL]';
  if (apiURL) {
    // Strip the host since we already know that.
    urlId = apiURL.replace(config.get('apiHost'), '');
    // Strip query string params since lang will vary quite a lot.
    urlId = urlId.split('?')[0];
  }
  const apiError = new Error(
    `Error calling: ${urlId} (status: ${response.status})`
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
  auth?: boolean,
  body?: Object,
  credentials?: boolean,
  endpoint: string,
  errorHandler?: ErrorHandlerType,
  method?: 'GET' | 'POST' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PUT' | 'PATCH',
  params?: Object,
  schema?: Object,
  state?: ApiStateType,
  _config?: typeof config,
|};

export function callApi({
  endpoint,
  schema,
  params = {},
  auth = false,
  state = initialApiState,
  method = 'GET',
  body,
  credentials,
  errorHandler,
  _config = config,
}: CallApiParams): Promise<any> {
  if (!endpoint) {
    return Promise.reject(
      new Error(`endpoint URL cannot be falsy: "${endpoint}"`)
    );
  }
  if (errorHandler) {
    errorHandler.clear();
  }

  const parsedUrl = url.parse(endpoint, true);
  let adjustedEndpoint = parsedUrl.pathname || '';
  if (!parsedUrl.host) {
    // If it's a relative URL, add the API prefix.
    const slash = !adjustedEndpoint.startsWith('/') ? '/' : '';
    adjustedEndpoint =
      `${config.get('apiPath')}${slash}${adjustedEndpoint}`;
  } else if (!adjustedEndpoint.startsWith(config.get('apiPath'))) {
    // If it's an absolute URL, it must have the correct prefix.
    return Promise.reject(
      new Error(`Absolute URL "${endpoint}" has an unexpected prefix.`)
    );
  }

  // Preserve the original query string if there is one.
  // This might happen when we parse `next` URLs returned by the API.
  const queryString = makeQueryString({
    ...parsedUrl.query, ...params, lang: state.lang,
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
    options.body = JSON.stringify(body);
    options.headers['Content-type'] = 'application/json';
  }
  if (auth) {
    if (state.token) {
      options.headers.authorization = `Bearer ${state.token}`;
    }
  }

  adjustedEndpoint = adjustedEndpoint.endsWith('/') ?
    adjustedEndpoint : `${adjustedEndpoint}/`;
  let apiURL =
    `${config.get('apiHost')}${adjustedEndpoint}${queryString}`;
  if (_config.get('server')) {
    log.debug('Encoding `apiURL` in UTF8 before fetch().');
    // Workaround for https://github.com/bitinn/node-fetch/issues/245
    apiURL = utf8.encode(apiURL);
  }

  return fetch(apiURL, options)
    .then((response) => {
      const contentType = response.headers.get('Content-Type').toLowerCase();

      // This is a bit paranoid, but we ensure the API returns a JSON response
      // (see https://github.com/mozilla/addons-frontend/issues/1701).
      // If not we'll store the text response in JSON and log an error.
      // If the JSON parsing fails; we log the error and return an "unknown
      // error".
      if (contentType === 'application/json') {
        return response.json()
          .then((jsonResponse) => ({ response, jsonResponse }));
      }

      log.warn(oneLine`Response from API was not JSON (was Content-Type:
        ${contentType})`, response);
      return response.text().then(() => {
        // jsonResponse should be an empty object in this case.
        // Otherwise, its keys could be treated as generic API errors.
        return { jsonResponse: {}, response };
      });
    })
    .then(({ response, jsonResponse }) => {
      if (response.ok) {
        return jsonResponse;
      }

      // If response is not ok we'll throw an error.
      const apiError = createApiError({ apiURL, response, jsonResponse });
      if (errorHandler) {
        errorHandler.handle(apiError);
      }
      throw apiError;
    }, (fetchError) => {
      // This actually handles the case when the call to fetch() is
      // rejected, say, for a network connection error, etc.
      if (errorHandler) {
        errorHandler.handle(fetchError);
      }
      throw fetchError;
    })
    .then((response) => (schema ? normalize(response, schema) : response));
}

type FetchAddonParams = {|
  api: ApiStateType,
  slug: string,
|};

export function fetchAddon({ api, slug }: FetchAddonParams) {
  return callApi({
    endpoint: `addons/addon/${slug}`,
    schema: addon,
    auth: true,
    state: api,
  });
}

export function startLoginUrl(
  { location }: {| location: ReactRouterLocation |},
) {
  const configName = config.get('fxaConfig');
  const params = {
    config: undefined,
    to: url.format({ ...location }),
  };
  if (configName) {
    params.config = configName;
  }
  const query = makeQueryString(params);
  return `${API_BASE}/accounts/login/start/${query}`;
}

export function categories({ api }: {| api: ApiStateType |}) {
  return callApi({
    endpoint: 'addons/categories',
    schema: { results: [category] },
    state: api,
  });
}

export function logOutFromServer({ api }: {| api: ApiStateType |}) {
  return callApi({
    auth: true,
    credentials: true,
    endpoint: 'accounts/session',
    method: 'DELETE',
    state: api,
  });
}

type AutocompleteParams = {|
  api: ApiStateType,
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
    state: api,
  });
}

type GetNextResponseType =
  (nextURL?: string) => Promise<PaginatedApiResponse<any>>;

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
    // eslint-disable-next-line no-await-in-loop
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
      log.debug(oneLine`Fetching next page "${nextURL}" of
        ${getNextResponse}`);
    } else {
      return { count, page_size: pageSize, results };
    }
  }

  // If we get this far the callback may not be advancing pages correctly.
  throw new Error(`Fetched too many pages (the limit is ${pageLimit})`);
};

export const validateLocalizedString = (localizedString: LocalizedString) => {
  if (typeof localizedString !== 'object') {
    throw new Error(
      `Expected an object type, got "${typeof localizedString}"`);
  }
  Object.keys(localizedString).forEach((localeKey) => {
    if (typeof languages[localeKey] === 'undefined') {
      throw new Error(`Unknown locale: "${localeKey}"`);
    }
  });
};
