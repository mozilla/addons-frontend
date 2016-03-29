import { Schema, arrayOf, normalize } from 'normalizr';

import config from 'config';

import 'isomorphic-fetch';


const API_BASE = config.get('apiBase');

const addon = new Schema('addons', {idAttribute: 'slug'});

function makeQueryString(opts) {
  // FIXME: This should use a real query string generator.
  return Object.keys(opts).map((k) => `${k}=${opts[k]}`).join('&');
}

function callApi(endpoint, schema, params) {
  const queryString = makeQueryString(params);
  return fetch(`${API_BASE}/${endpoint}/?${queryString}`)
    .then((response) => response.json())
    .then((response) => normalize(response, schema));
}

export function search({ page, query }) {
  // TODO: Get the language from the server.
  return callApi(
    'addons/search',
    {results: arrayOf(addon)},
    {q: query, lang: 'en-US', page});
}

export function fetchAddon(slug) {
  return callApi(`addons/addon/${slug}`, addon, {lang: 'en-US'});
}
