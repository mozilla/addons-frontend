// import { camelizeKeys } from 'humps';
import { Schema, arrayOf, normalize } from 'normalizr';

import 'isomorphic-fetch';

const API_ROOT = 'http://olympia.dev/api/v3/';

// Fetches an API response and normalizes the result JSON according to schema.
// This makes every API response have the same shape, regardless of how nested it was.
function callApi(endpoint, schema) {
  const fullUrl = (endpoint.indexOf(API_ROOT) === -1) ? API_ROOT + endpoint : endpoint;

  return fetch(fullUrl)
    .then(response =>
      response.json().then(json => ({ json, response }))
    ).then(({ json, response }) => {
      if (!response.ok) {
        return Promise.reject(json);
      }

      const camelizedJson = json;
      // const camelizedJson = camelizeKeys(json);
      // const nextPageUrl = getNextPageUrl(response);

      return Object.assign({},
        normalize(camelizedJson, schema),
        // { nextPageUrl }
      );
    });
}

function responseSchema(schema) {
  return {
    results: schema,
  };
}

const addon = new Schema('addons', {idAttribute: 'slug'});

// Action key that carries API call info interpreted by this Redux middleware.
export const CALL_API = Symbol('Call API');

export const Schemas = {
  ADDON: addon,
  ADDON_ARRAY: responseSchema(arrayOf(addon)),
};

// A Redux middleware that interprets actions with CALL_API info specified.
// Performs the call and promises when such actions are dispatched.
export default store => next => action => {
  const callAPI = action[CALL_API];
  if (typeof callAPI === 'undefined') {
    return next(action);
  }

  let { endpoint } = callAPI;
  const { schema, types } = callAPI;

  if (typeof endpoint === 'function') {
    endpoint = endpoint(store.getState());
  }

  if (typeof endpoint !== 'string') {
    throw new Error('Specify a string endpoint URL.');
  }
  if (!schema) {
    throw new Error('Specify one of the exported Schemas.');
  }
  if (!Array.isArray(types) || types.length !== 3) {
    throw new Error('Expected an array of three action types.');
  }
  if (!types.every(type => typeof type === 'string')) {
    throw new Error('Expected action types to be strings.');
  }

  function actionWith(data) {
    const finalAction = Object.assign({}, action, data);
    delete finalAction[CALL_API];
    return finalAction;
  }

  const [requestType, successType, failureType] = types;
  next(actionWith({ type: requestType }));

  return callApi(endpoint, schema).then(
    response => next(actionWith({
      response,
      type: successType,
    })),
    error => next(actionWith({
      type: failureType,
      error: error.detail || 'Something bad happened',
    }))
  );
};
