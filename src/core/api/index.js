/* global fetch */
/* eslint-disable arrow-body-style */

import url from 'url';

import 'isomorphic-fetch';
import { schema as normalizrSchema, normalize } from 'normalizr';
import config from 'config';

import log from 'core/logger';
import { convertFiltersToQueryParams } from 'core/searchUtils';


const API_BASE = `${config.get('apiHost')}${config.get('apiPath')}`;
const Entity = normalizrSchema.Entity;

export const addon = new Entity('addons', {}, { idAttribute: 'slug' });
export const category = new Entity('categories', {}, { idAttribute: 'slug' });
export const user = new Entity('users', {}, { idAttribute: 'username' });

export function makeQueryString(query) {
  return url.format({ query });
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
      return response.json()
        .then(
          (jsonResponse) => ({ response, jsonResponse }),
          (error) => {
            log.warn('Could not parse response as JSON:', error);
            return response.text().then((textResponse) =>
              ({ response, jsonResponse: { text: textResponse } })
            );
          }
        );
    })
    .then(({ response, jsonResponse }) => {
      if (response.ok) {
        return jsonResponse;
      }

      // If response is not ok we'll throw.
      // Note that if callApi is executed by an asyncConnect() handler,
      // then redux-connect will catch this exception and
      // dispatch a LOAD_FAIL action which puts the error in state.

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
