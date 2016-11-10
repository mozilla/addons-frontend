/* global fetch */

import url from 'url';

import 'isomorphic-fetch';
import { Schema, arrayOf, normalize } from 'normalizr';
import config from 'config';

const API_BASE = `${config.get('apiHost')}${config.get('apiPath')}`;

export const addon = new Schema('addons', { idAttribute: 'slug' });
export const categorySchema = new Schema('categories', { idAttribute: 'slug' });
export const user = new Schema('users', { idAttribute: 'username' });

function makeQueryString(query) {
  return url.format({ query });
}

export function callApi({
  endpoint, schema, params = {}, auth = false, state = {}, method = 'get',
  body, credentials,
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
      if (response.ok) {
        return response.json();
      }

      // If response is not ok we'll throw.
      // Notes that redux-connect will catch this exception and
      // pass it up to the state as an error for this api call.
      const apiError = new Error('Error calling API');
      apiError.response = {
        apiURL,
        status: response.status,
      };
      throw apiError;
    })
    .then((response) => (schema ? normalize(response, schema) : response));
}

export function categories({ api }) {
  return callApi({
    endpoint: 'addons/categories',
    schema: { results: arrayOf(categorySchema) },
    state: api,
  });
}

export function search({ api, page, query, auth = false, category, addonType }) {
  // TODO: Get the language from the server.
  return callApi({
    endpoint: 'addons/search',
    schema: { results: arrayOf(addon) },
    params: { q: query, page, app: api.clientApp, category, type: addonType },
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
