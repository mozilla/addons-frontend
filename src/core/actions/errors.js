import { CLEAR_ERROR, SET_ERROR } from 'core/constants';

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

export function clearError(id) {
  if (!id) {
    throw new Error('id cannot be empty');
  }
  return {
    type: CLEAR_ERROR,
    payload: { id },
  };
}
