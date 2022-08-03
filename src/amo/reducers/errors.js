import { createSlice } from '@reduxjs/toolkit';

import {
  ERROR_ADDON_DISABLED_BY_ADMIN,
  ERROR_ADDON_DISABLED_BY_DEV,
  ERROR_UNKNOWN,
} from 'amo/constants';
import log from 'amo/logger';

/*
 * This inspects an error object and returns an array of messages from it.
 *
 * If the error has an API response then messages will be extracted
 * from it. Otherwise, an array containing a generic error message is returned.
 *
 * Read more about API responses here:
 * http://addons-server.readthedocs.io/en/latest/topics/api/overview.html#responses
 */
function getMessagesFromError(error) {
  const errorData = {
    code: ERROR_UNKNOWN,
    messages: [],
  };
  log.debug('Extracting messages from error object:', error);

  const logCodeChange = ({ oldCode, newCode }) => {
    log.warn(`Replacing error code ${oldCode} with ${newCode}`);
  };

  if (error && error.response && error.response.data) {
    // Extract a code and messages from the JSON response.
    Object.keys(error.response.data).forEach((key) => {
      const value = error.response.data[key];
      if (Array.isArray(value)) {
        // Most API reponse errors will consist of a key (which could be
        // a form field) and an array of localized messages.
        // More info:
        // http://addons-server.readthedocs.io/en/latest/topics/api/overview.html#bad-requests
        value.forEach((message) => {
          // Add a field specific error message. We do not prefix the message with
          // `key`, which is the field name (or `non_field_errors`), since it is not
          // localized.
          errorData.messages.push(message);
        });
      } else if (key === 'code') {
        errorData.code = value;
      } else if (key === 'is_disabled_by_developer') {
        if (value === true) {
          const newCode = ERROR_ADDON_DISABLED_BY_DEV;
          logCodeChange({ oldCode: errorData.code, newCode });
          errorData.code = newCode;
        }
      } else if (key === 'is_disabled_by_mozilla') {
        if (value === true) {
          const newCode = ERROR_ADDON_DISABLED_BY_ADMIN;
          logCodeChange({ oldCode: errorData.code, newCode });
          errorData.code = newCode;
        }
      } else if (typeof value === 'string' || typeof value === 'object') {
        // This is a catch-all for errors that are not structured like
        // Django/DRF form field errors. It won't be perfect but at least
        // the user will see some kind of error.
        errorData.messages.push(value);
      } else {
        log.warn(`Ignoring key "${key}": "${value}" in data of error response`);
      }
    });
  }

  if (!errorData.messages.length) {
    log.warn(`Error object did not contain any messages: ${error}`);
  }

  return errorData;
}

// The state looks like:
//
// type ErrorState = {
//   [id: string]: {|
//     code?: string,
//     messages: Array<string>,
//     responseStatusCode?: string,
//   |},
// };
//
export const initialState = {};

const errorsSlice = createSlice({
  name: 'errors',
  initialState,
  reducers: {
    clearError(state, action) {
      state[action.payload] = null;
    },
    setError(state, action) {
      const { code, messages } = getMessagesFromError(action.payload.error);
      state[action.payload.id] = {
        code,
        messages,
        responseStatusCode: action.payload.error.response
          ? action.payload.error.response.status
          : null,
      };
    },
    setErrorMessage(state, action) {
      const errorData = state[action.payload.id] || {
        messages: [],
      };
      errorData.messages.push(action.payload.message);
      state[action.payload.id] = errorData;
    },
  },
});

export const { clearError, setError, setErrorMessage } = errorsSlice.actions;
export default errorsSlice.reducer;
