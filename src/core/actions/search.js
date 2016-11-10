import {
  SEARCH_STARTED,
  SEARCH_LOADED,
  SEARCH_FAILED,
} from 'core/constants';

export function searchStart({ page, query, addonType, app, category }) {
  return {
    type: SEARCH_STARTED,
    payload: { page, addonType, app, category, query },
  };
}

export function searchLoad({ query, entities, result, addonType, app, category }) {
  return {
    type: SEARCH_LOADED,
    payload: { entities, result, addonType, app, category, query },
  };
}

export function searchFail({ page, query, addonType, app, category }) {
  return {
    type: SEARCH_FAILED,
    payload: { page, addonType, app, category, query },
  };
}
