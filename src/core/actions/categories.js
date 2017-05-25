import {
  CATEGORIES_FETCH,
  CATEGORIES_LOAD,
  CATEGORIES_FAIL,
} from 'core/constants';

export function categoriesFetch() {
  return {
    type: CATEGORIES_FETCH,
    payload: {},
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
