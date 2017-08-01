import {
  SEARCH_STARTED,
  SEARCH_LOADED,
  SEARCH_FAILED,
} from 'core/constants';


export function searchStart({ errorHandlerId, filters, page, results }) {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!filters) {
    throw new Error('filters are required');
  }
  if (!page) {
    throw new Error('page is required');
  }
  if (!results) {
    throw new Error('results are required');
  }

  return {
    type: SEARCH_STARTED,
    payload: { errorHandlerId, filters, page, results },
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
