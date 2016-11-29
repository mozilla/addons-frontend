import { SET_ERROR } from 'core/constants';

export function setError({ error, id } = {}) {
  if (!id) {
    throw new Error('id cannot be empty');
  }
  return {
    type: SET_ERROR,
    payload: { error, id },
  };
}

export function clearError(id) {
  return setError({ id, error: null });
}
