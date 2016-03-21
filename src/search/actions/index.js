export function searchStart(query) {
  return {
    type: 'SEARCH_STARTED',
    payload: { query },
  };
}

export function searchLoad({ query, entities, result }) {
  return {
    type: 'SEARCH_LOADED',
    payload: { entities, query, result },
  };
}

export function addonLoad(addon) {
  return {
    type: 'ADDON_LOADED',
    payload: {entities: [addon]},
  };
}

export function loadEntities(entities) {
  return {
    type: 'ENTITIES_LOADED',
    payload: {entities},
  };
}

