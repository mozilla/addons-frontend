import { CLEAR_ERROR, SET_ERROR } from 'core/constants';
import log from 'core/logger';
import { gettext } from 'core/utils';

/*
 * This inspects an error object and returns an array of messages from it.
 *
 * If the error has an API response then messages will be extracted
 * from it. Otherwise, an array containing a generic error message is returned.
 */
function getMessagesFromError(error) {
  let messages = [gettext('An unexpected error occurred')];
  log.info('Extracting messages from error object:', error);

  if (error && error.response && error.response.data) {
    const apiMessages = [];

    Object.keys(error.response.data).forEach((key) => {
      const val = error.response.data[key];
      if (Array.isArray(val)) {
        val.forEach((msg) => {
          if (key === 'non_field_errors') {
            // Add generic messages for the API response.
            apiMessages.push(msg);
          } else {
            // Add field specific error messages.
            apiMessages.push(`${key}: ${msg}`);
          }
        });
      } else {
        apiMessages.push(val);
      }
    });

    if (apiMessages.length) {
      messages = apiMessages;
    } else {
      log.warn('API error response did not contain any messages', error);
    }
  }
  return messages;
}

export const initialState = {};

export default function errors(state = initialState, action) {
  switch (action.type) {
    case CLEAR_ERROR:
      return {
        ...state,
        [action.payload.id]: null,
      };
    case SET_ERROR:
      return {
        ...state,
        [action.payload.id]: {
          messages: getMessagesFromError(action.payload.error),
        },
      };
    default:
      return state;
  }
}
