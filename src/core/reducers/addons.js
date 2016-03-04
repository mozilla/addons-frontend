const initialState = {
  wat: {slug: 'wat', title: 'Wat is this?'},
  foo: {slug: 'foo', title: 'The foo add-on'},
  food: {slug: 'food', title: 'Find food'},
  bar: {slug: 'bar', title: 'The bar add-on'},
};

export default function addon(state = initialState, action) {
  switch (action.type) {
    case 'ADDON_FETCHED':
      return Object.assign({}, state, {[action.addon.slug]: action.addon});
    default:
      return state;
  }
}
