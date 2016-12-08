import {
  HIGHLY_RATED_GET,
  HIGHLY_RATED_LOADED,
  HIGHLY_RATED_FAILED,
} from 'core/constants';


export function highlyRatedStart({ page, filters }) {
  return {
    type: HIGHLY_RATED_GET,
    payload: { page, filters },
  };
}

export function highlyRatedLoad({ entities, result, filters }) {
  return {
    type: HIGHLY_RATED_LOADED,
    payload: { entities, result, filters },
  };
}

export function highlyRatedFail({ page, filters }) {
  return {
    type: HIGHLY_RATED_FAILED,
    payload: { page, filters },
  };
}
