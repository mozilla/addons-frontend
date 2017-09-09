/* @flow */
/* global fetch */
import url from 'url';

import utf8 from 'utf8';
import 'isomorphic-fetch';
import { normalize } from 'normalizr';
import { oneLine } from 'common-tags';
import config from 'config';

import { initialApiState } from 'core/reducers/api';
import log from 'core/logger';
import * as addonApi from 'core/api/addon';
import * as authenticationApi from 'core/api/authentication';
import * as categoriesApi from 'core/api/categories';
import * as featuredApi from 'core/api/featured';
import * as searchApi from 'core/api/search';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { ApiStateType } from 'core/reducers/api';


export const API_BASE = `${config.get('apiHost')}${config.get('apiPath')}`;

// TODO: Move this to a utils file.
export function makeQueryString(query: { [key: string]: * }) {
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
}: CallApiParams): Promise<any> {
  if (errorHandler) {
    errorHandler.clear();
  }
  const queryString = makeQueryString({ ...params, lang: state.lang });
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
  // Workaround for https://github.com/bitinn/node-fetch/issues/245
  const apiURL = utf8.encode(`${API_BASE}/${endpoint}/${queryString}`);

  // $FLOW_FIXME: once everything uses Flow we won't have to use toUpperCase
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
      // Note that if callApi is executed by an asyncConnect() handler,
      // then redux-connect will catch this exception and
      // dispatch a LOAD_FAIL action which puts the error in the state.
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

// Schemas
// TODO: Remove this when
// https://github.com/mozilla/addons-frontend/issues/2917 is fixed.
export const addon = addonApi.addonSchema;
export const category = categoriesApi.categorySchema;

// Add-on APIs
export const fetchAddon = addonApi.fetchAddon;
// Auth APIs
export const login = authenticationApi.login;
export const logOutFromServer = authenticationApi.logOutFromServer;
export const startLoginUrl = authenticationApi.startLoginUrl;
// Category APIs
export const categories = categoriesApi.categories;
// Featured Add-on APIs
export const featured = featuredApi.featured;
// Search and Autocomplete APIs
export const autocomplete = searchApi.autocomplete;
export const search = searchApi.search;
