export function searchStart(query, page) {
  return {
    type: 'SEARCH_STARTED',
    payload: { page, query },
  };
}

export function searchLoad({ query, entities, result }) {
  return {
    type: 'SEARCH_LOADED',
    payload: { entities, query, result },
  };
}

export function loadEntities(entities) {
  return {
    type: 'ENTITIES_LOADED',
    payload: {entities},
  };
}
