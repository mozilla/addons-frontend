import {
  POPULAR_GET,
  POPULAR_LOADED,
  POPULAR_FAILED,
} from 'core/constants';


export function popularStart({ page, filters }) {
  return {
    type: POPULAR_GET,
    payload: { page, filters },
  };
}

export function popularLoad({ entities, result, filters }) {
  return {
    type: POPULAR_LOADED,
    payload: { entities, result, filters },
  };
}

export function popularFail({ page, filters }) {
  return {
    type: POPULAR_FAILED,
    payload: { page, filters },
  };
}
