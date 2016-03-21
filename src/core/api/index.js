import { Schema, arrayOf, normalize } from 'normalizr';

import config from 'config';

import 'isomorphic-fetch';


const API_HOST = config.get('apiHost');
const API_BASE = `${API_HOST}/api/v3`;

const addon = new Schema('addons', {idAttribute: 'slug'});

function makeQueryString(opts) {
  // FIXME: This should use a real query string generator.
  return Object.keys(opts).map((k) => `${k}=${opts[k]}`).join('&');
}

export function search({ query }) {
  // TODO: Get the language from the server.
  const queryString = makeQueryString({q: query, lang: 'en-US'});
  return fetch(`${API_BASE}/addons/search/?${queryString}`)
    .then((response) => response.json())
    .then((response) => normalize(response, {results: arrayOf(addon)}));
}

export function loadAddon(slug) {
  return fetch(`${API_BASE}/addons/addon/${slug}/?lang=en-US`)
    .then((response) => response.json())
    .then((response) => normalize(response, addon));
}
