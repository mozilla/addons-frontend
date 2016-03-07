const initialState = {
  query: null,
};

export default function search(state = initialState, action) {
  switch (action.type) {
    case 'SET_QUERY':
      return Object.assign({}, state, {query: action.query});
    default:
      return state;
  }
}

export function getMatchingAddons(addons, query) {
  const matches = [];
  for (const slug in addons) {
    if (addons[slug].title.indexOf(query) >= 0) {
      matches.push(addons[slug]);
    }
  }
  return matches;
}
