import { SET_ERROR } from 'core/constants';

export function setError({ error, id }) {
  // TODO: check for empty id
  return {
    type: SET_ERROR,
    payload: { error, id },
  };
}
