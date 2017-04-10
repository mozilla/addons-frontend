import { CLEAR_ERROR, SET_ERROR } from 'core/constants';
import log from 'core/logger';
import { gettext } from 'core/utils';

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
  let data = {
    errorCode: undefined,
    messages: [gettext('An unexpected error occurred')],
  };
  log.info('Extracting messages from error object:', error);

  if (error && error.response && error.response.data) {
    const apiMessages = [];

    Object.keys(error.response.data).forEach((key) => {
      const val = error.response.data[key];
      if (Array.isArray(val)) {
        // Most API reponse errors will consist of a key (which could be a
        // form field) and an array of localized messages.
        // More info: http://addons-server.readthedocs.io/en/latest/topics/api/overview.html#bad-requests
        val.forEach((msg) => {
          if (key === 'non_field_errors') {
            // Add a generic error not related to a specific field.
            apiMessages.push(msg);
          } else {
            // Add field specific error message.
            // The field is not localized but we need to show it as a hint.
            apiMessages.push(`${key}: ${msg}`);
          }
        });
      } else {
        // This is most likely not a form field error so just show the message.
        apiMessages.push(val);
      }
    });

    if (apiMessages.length) {
      data = { ...data, messages: apiMessages };
    } else {
      log.warn('API error response did not contain any messages', error);
    }

    data = { ...data, code: error.response.data.code };
  }
  return data;
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
