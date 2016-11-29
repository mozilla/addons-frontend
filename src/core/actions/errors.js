import { SET_ERROR } from 'core/constants';

export function setError({ error, id }) {
  let messages = ['An unexpected error occurred'];
  if (error &&
      error.response &&
      error.response.data &&
      error.response.data.non_field_errors) {
    // TODO: check for all field errors.
    messages = error.response.data.non_field_errors;
  }
  return {
    type: SET_ERROR,
    payload: {
      error, id, messages,
    },
  };
}
