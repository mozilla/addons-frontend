import {
  SEARCH_STARTED,
  SEARCH_LOADED,
  SEARCH_FAILED,
} from 'core/constants';

export function searchStart(query, page) {
  return {
    type: SEARCH_STARTED,
    payload: { page, query },
  };
}

export function searchLoad({ query, entities, result }) {
  return {
    type: SEARCH_LOADED,
    payload: { entities, query, result },
  };
}

export function searchFail({ page, query }) {
  return {
    type: SEARCH_FAILED,
    payload: { page, query },
  };
}
