/* global fetch */
/* eslint-disable arrow-body-style */

import url from 'url';

import 'isomorphic-fetch';
import { schema as normalizrSchema, normalize } from 'normalizr';
import { oneLine } from 'common-tags';
import config from 'config';

import log from 'core/logger';
import { convertFiltersToQueryParams } from 'core/searchUtils';


const API_BASE = `${config.get('apiHost')}${config.get('apiPath')}`;
const Entity = normalizrSchema.Entity;

export const addon = new Entity('addons', {}, { idAttribute: 'slug' });
export const category = new Entity('categories', {}, { idAttribute: 'slug' });
export const user = new Entity('users', {}, { idAttribute: 'username' });

export function makeQueryString(query) {
  const resolvedQuery = { ...query };
  Object.keys(resolvedQuery).forEach((key) => {
    if (resolvedQuery[key] === undefined) {
      // Make sure we don't turn this into ?key= (empty string) because
      // sending an empty string to the API sometimes triggers bugs.
      delete resolvedQuery[key];
    }
  });
  return url.format({ query: resolvedQuery });
}

export function createApiError({ apiURL, response, jsonResponse }) {
  const apiError = new Error('Error calling API');
  apiError.response = {
    apiURL,
    status: response.status,
    data: jsonResponse,
  };
  return apiError;
}

export function callApi({
  endpoint, schema, params = {}, auth = false, state = {}, method = 'get',
  body, credentials, errorHandler,
}) {
  if (errorHandler) {
    errorHandler.clear();
  }
  const queryString = makeQueryString({ ...params, lang: state.lang });
  const options = {
    headers: {},
    // Always make sure the method is upper case so that the browser won't
    // complain about CORS problems.
    method: method.toUpperCase(),
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
  const apiURL = `${API_BASE}/${endpoint}/${queryString}`;

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
      return response.text().then((textResponse) => (
        { jsonResponse: { text: textResponse }, response }
      ));
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

export function search({ api, page, auth = false, filters = {} }) {
  return callApi({
    endpoint: 'addons/search',
    schema: { results: [addon] },
    params: {
      app: api.clientApp,
      ...convertFiltersToQueryParams(filters),
      page,
    },
    state: api,
    auth,
  });
}

export function fetchAddon({ api, slug }) {
  return callApi({
    endpoint: `addons/addon/${slug}`,
    schema: addon,
    auth: true,
    state: api,
  });
}

export function login({ api, code, state }) {
  const params = {};
  const configName = config.get('fxaConfig');
  if (configName) {
    params.config = configName;
  }
  return callApi({
    endpoint: 'accounts/login',
    method: 'post',
    body: { code, state },
    params,
    state: api,
    credentials: true,
  });
}

export function startLoginUrl({ location }) {
  const configName = config.get('fxaConfig');
  const params = { to: url.format({ ...location }) };
  if (configName) {
    params.config = configName;
  }
  const query = makeQueryString(params);
  return `${API_BASE}/accounts/login/start/${query}`;
}

export function fetchProfile({ api }) {
  return callApi({
    endpoint: 'accounts/profile',
    schema: user,
    auth: true,
    state: api,
  });
}

export function featured({ api, filters, page }) {
  return callApi({
    endpoint: 'addons/featured',
    params: {
      app: api.clientApp,
      ...convertFiltersToQueryParams(filters),
      page,
    },
    schema: { results: [addon] },
    state: api,
  });
}

export function categories({ api }) {
  return callApi({
    endpoint: 'addons/categories',
    schema: { results: [category] },
    state: api,
  });
}
