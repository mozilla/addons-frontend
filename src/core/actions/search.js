import {
  SEARCH_STARTED,
  SEARCH_LOADED,
  SEARCH_FAILED,
} from 'core/constants';


export function searchStart({ filters, page, results }) {
  return {
    type: SEARCH_STARTED,
    payload: { filters, page, results },
  };
}

export function searchLoad({ entities, result, filters }) {
  return {
    type: SEARCH_LOADED,
    payload: { entities, result, filters },
  };
}

export function searchFail({ page, filters }) {
  return {
    type: SEARCH_FAILED,
    payload: { page, filters },
  };
}
