import { SEARCH_STARTED, SEARCH_LOADED } from 'core/constants';

export function searchStart({ errorHandlerId, filters }) {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!filters) {
    throw new Error('filters are required');
  }

  return {
    type: SEARCH_STARTED,
    payload: { errorHandlerId, filters },
  };
}

export function searchLoad({ entities, result }) {
  if (!entities) {
    throw new Error('entities are required');
  }
  if (!result) {
    throw new Error('result is required');
  }

  return {
    type: SEARCH_LOADED,
    payload: { entities, result },
  };
}
