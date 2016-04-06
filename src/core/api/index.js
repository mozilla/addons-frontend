import { Schema, arrayOf, normalize } from 'normalizr';

import config from 'config';

import 'isomorphic-fetch';

const API_BASE = config.get('apiBase');

const addon = new Schema('addons', {idAttribute: 'slug'});

function makeQueryString(opts) {
  // FIXME: This should use a real query string generator.
  return Object.keys(opts).map((k) => `${k}=${opts[k]}`).join('&');
}

export default class ApiClient {
  constructor({getState}) {
    this.getState = getState;
  }

  bearerToken() {
    return this.getState().auth.token;
  }

  callApi(endpoint, schema, params, auth = false) {
    const queryString = makeQueryString(params);
    const options = {headers: {}};
    if (auth) {
      const token = this.bearerToken();
      if (token) {
        options.headers.authorization = `Bearer ${token}`;
      }
    }
    return fetch(`${API_BASE}/${endpoint}/?${queryString}`, options)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Error calling API');
      })
      .then((response) => normalize(response, schema));
  }

  search({ page, query }) {
    // TODO: Get the language from the server.
    return this.callApi(
      'addons/search',
      {results: arrayOf(addon)},
      {q: query, lang: 'en-US', page});
  }

  fetchAddon(slug) {
    return this.callApi(`addons/addon/${slug}`, addon, {lang: 'en-US'}, true);
  }
}
