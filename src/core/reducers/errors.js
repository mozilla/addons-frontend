import { CLEAR_ERROR, ERROR_UNKNOWN, SET_ERROR } from 'core/constants';
import log from 'core/logger';

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
  let errorData = {
    code: ERROR_UNKNOWN,
    messages: [],
  };
  log.info('Extracting messages from error object:', error);

  if (error && error.response && error.response.data) {
    Object.keys(error.response.data).forEach((key) => {
      const val = error.response.data[key];
      if (key === 'code') {
        errorData = { ...errorData, code: val };
        return;
      }
      if (Array.isArray(val)) {
        // Most API reponse errors will consist of a key (which could be a
        // form field) and an array of localized messages.
        // More info: http://addons-server.readthedocs.io/en/latest/topics/api/overview.html#bad-requests
        val.forEach((msg) => {
          if (key === 'non_field_errors') {
            // Add a generic error not related to a specific field.
            errorData.messages.push(msg);
          } else {
            // Add field specific error message.
            // The field is not localized but we need to show it as a hint.
            errorData.messages.push(`${key}: ${msg}`);
          }
        });
      } else {
        // This is most likely not a form field error so just show the message.
        errorData.messages.push(val);
      }
    });
  }

  if (!errorData.messages.length) {
    log.warn('Error object did not contain any messages', error);
  }

  return errorData;
}

export const initialState = {};

export default function errors(state = initialState, action) {
  switch (action.type) {
    case CLEAR_ERROR:
      return {
        ...state,
        [action.payload.id]: null,
      };
    case SET_ERROR: {
      const { code, messages } =
        getMessagesFromError(action.payload.error);
      return {
        ...state,
        [action.payload.id]: { code, messages },
      };
    }
    default:
      return state;
  }
}
