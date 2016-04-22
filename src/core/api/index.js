import { Schema, arrayOf, normalize } from 'normalizr';

import config from 'config';

import 'isomorphic-fetch';

const API_BASE = config.get('apiBase');

const addon = new Schema('addons', {idAttribute: 'slug'});

function makeQueryString(opts) {
  // FIXME: This should use a real query string generator.
  return Object.keys(opts).map((k) => `${k}=${opts[k]}`).join('&');
}

function callApi({endpoint, schema, params, auth = false, state = {}, method = 'get', body,
                  credentials}) {
  const queryString = makeQueryString(params);
  const options = {
    headers: {},
    method,
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
  return fetch(`${API_BASE}/${endpoint}/?${queryString}`, options)
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
      throw new Error('Error calling API');
    })
    .then((response) => (schema ? normalize(response, schema) : response));
}

export function search({ api, page, query }) {
  // TODO: Get the language from the server.
  return callApi({
    endpoint: 'addons/search',
    schema: {results: arrayOf(addon)},
    params: {q: query, lang: 'en-US', page},
    state: api,
  });
}

export function fetchAddon({ api, slug }) {
  return callApi({
    endpoint: `addons/addon/${slug}`,
    schema: addon,
    params: {lang: 'en-US'},
    auth: true,
    state: api,
  });
}

export function login({ api, code, state }) {
  return callApi({
    endpoint: 'internal/accounts/login',
    method: 'post',
    body: {code, state},
    params: {lang: 'en-US'},
    state: api,
    credentials: true,
  });
}
