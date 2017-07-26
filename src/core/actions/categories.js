import {
  CATEGORIES_FETCH,
  CATEGORIES_LOAD,
  CATEGORIES_FAIL,
} from 'core/constants';

export function categoriesFetch({ errorHandlerId } = {}) {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  return {
    type: CATEGORIES_FETCH,
    payload: { errorHandlerId },
  };
}

export function categoriesLoad(response) {
  return {
    type: CATEGORIES_LOAD,
    payload: { result: response.result },
  };
}

export function categoriesFail(error) {
  return {
    type: CATEGORIES_FAIL,
    payload: { error },
  };
}
