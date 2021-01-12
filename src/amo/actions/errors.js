import { CLEAR_ERROR, SET_ERROR, SET_ERROR_MESSAGE } from 'amo/constants';

export function setError({ error, id } = {}) {
  if (!id) {
    throw new Error('id cannot be empty');
  }
  if (!error) {
    throw new Error('error cannot be empty');
  }
  return {
    type: SET_ERROR,
    payload: { error, id },
  };
}

export function setErrorMessage({ message, id } = {}) {
  if (!id) {
    throw new Error('id cannot be empty');
  }
  if (!message) {
    throw new Error('message cannot be empty');
  }
  return {
    type: SET_ERROR_MESSAGE,
    payload: { id, message },
  };
}

export function clearError(id) {
  if (!id) {
    throw new Error('id cannot be empty');
  }
  return {
    type: CLEAR_ERROR,
    payload: { id },
  };
}
