import { CATEGORIES_FETCH, CATEGORIES_LOAD } from 'core/constants';

export function categoriesFetch({ errorHandlerId } = {}) {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  return {
    type: CATEGORIES_FETCH,
    payload: { errorHandlerId },
  };
}

export function categoriesLoad({ results }) {
  return {
    type: CATEGORIES_LOAD,
    payload: { results },
  };
}
