export function adminSearchStart(query, page) {
  return {
    type: 'ADMIN_SEARCH_STARTED',
    payload: { page, query },
  };
}

export function adminSearchLoad({ query, entities, result }) {
  return {
    type: 'ADMIN_SEARCH_LOADED',
    payload: { entities, query, result },
  };
}

export function adminSearchFail({ page, query }) {
  return {
    type: 'ADMIN_SEARCH_FAILED',
    payload: { page, query },
  };
}
