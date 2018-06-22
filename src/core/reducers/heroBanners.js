import { knuthShuffle } from 'knuth-shuffle';

// Hero banners have three items max, all the time :-)
const MAX_ITEMS = 3;
export const SET_HERO_BANNER_ORDER = 'SET_HERO_BANNER_ORDER';

export const setHeroBannerOrder = ({ name, random = false, sections }) => {
  if (!name) {
    throw new Error('name is required');
  }
  if (!sections) {
    throw new Error('sections are required');
  }

  return {
    payload: { name, random, sections },
    type: SET_HERO_BANNER_ORDER,
  };
};

export const initialState = {};

export default function heroBannerOrderReducer(state = initialState, action) {
  switch (action.type) {
    case SET_HERO_BANNER_ORDER: {
      const { name, random, sections } = action.payload;
      const orderArray = [...sections.keys()];
      const order = random ? knuthShuffle(orderArray) : orderArray;

      return {
        ...state,
        [name]: {
          order: order.slice(0, MAX_ITEMS),
        },
      };
    }
    default:
      return state;
  }
}
