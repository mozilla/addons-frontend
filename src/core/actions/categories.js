import {
  CATEGORIES_GET,
  CATEGORIES_LOAD,
  CATEGORIES_FAILED,
} from 'core/constants';

export function categoriesGet() {
  return {
    type: CATEGORIES_GET,
    payload: { loading: true },
  };
}

export function categoriesLoad({ result }) {
  return {
    type: CATEGORIES_LOAD,
    payload: {
      loading: false,
      result,
    },
  };
}

export function categoriesFail() {
  return {
    type: CATEGORIES_FAILED,
    payload: { loading: false },
  };
}
