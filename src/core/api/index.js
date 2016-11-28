/* global fetch */

import url from 'url';

import 'isomorphic-fetch';
import { Schema, arrayOf, normalize } from 'normalizr';
import config from 'config';

import { convertFiltersToQueryParams } from 'core/searchUtils';


const API_BASE = `${config.get('apiHost')}${config.get('apiPath')}`;

export const addon = new Schema('addons', { idAttribute: 'slug' });
export const category = new Schema('categories', { idAttribute: 'slug' });
export const user = new Schema('users', { idAttribute: 'username' });

function makeQueryString(query) {
  return url.format({ query });
}

export function callApi({
  endpoint, schema, params = {}, auth = false, state = {}, method = 'get',
  body, credentials, errorHandler,
}) {
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
      return response.json().then((jsonResponse) => {
        return { response, jsonResponse };
      }, (error) => {
        console.warn('Could not parse response as JSON:', error);
        return response.text().then((textResponse) => {
          return { response, jsonResponse: { text: textResponse } };
        });
      });
    })
    .then(({ response, jsonResponse }) => {
      if (response.ok) {
        return jsonResponse;
      }

      // If response is not ok we'll throw.
      // Note that if callApi is executed by an asyncConnect() handler,
      // then redux-connect will catch this exception and
      // dispatch a LOAD_FAIL action which puts the error in state.
      const apiError = new Error('Error calling API');
      apiError.response = {
        apiURL,
        status: response.status,
        data: jsonResponse,
      };
      if (errorHandler) {
        errorHandler.handle(apiError);
      }
      throw apiError;
    })
    .then((response) => (schema ? normalize(response, schema) : response));
}

export function search({ api, page, auth = false, filters = {} }) {
  return callApi({
    endpoint: 'addons/search',
    schema: { results: arrayOf(addon) },
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

export function featured({ addonType, api }) {
  return callApi({
    endpoint: 'addons/featured',
    params: { app: api.clientApp, type: addonType },
    schema: { results: arrayOf(addon) },
    state: api,
  });
}

export function categories({ api }) {
  return callApi({
    endpoint: 'addons/categories',
    schema: { results: arrayOf(category) },
    state: api,
  });
}
