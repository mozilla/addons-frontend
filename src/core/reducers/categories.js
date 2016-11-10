import config from 'config';
import {
  CATEGORIES_GET,
  CATEGORIES_LOAD,
  CATEGORIES_FAILED,
} from 'core/constants';


export function emptyCategoryList() {
  let categories = {};
  config.get('validClientApplications').forEach((appName) => {
    categories[appName] = {};
  });
  return categories;
}

const initialState = {
  categories: emptyCategoryList(),
  error: false,
  loading: false,
};

export default function categories(state = initialState, action) {
  const { payload } = action;

  switch (action.type) {
    case CATEGORIES_GET:
      return { ...state, ...payload, loading: true };
    case CATEGORIES_LOAD:
      let categories = emptyCategoryList();
      payload.result.forEach((result) => {
        // If the API returns data for an application we don't support,
        // we'll ignore it for now.
        if (!categories[result.application]) {
          return;
        }

        if (!categories[result.application][result.type]) {
          categories[result.application][result.type] = [];
        }

        categories[result.application][result.type].push({
          ...result,
          // count: 0,
          // page: null,
          // results: [],
        });
      });

      config.get('validClientApplications').forEach((appName) => {
        Object.keys(categories[appName]).forEach((addonType) => {
          categories[appName][addonType] = categories[appName][addonType]
            .sort((a, b) => a.name > b.name)
            .reduce((object, value, index) => {
              object[value.slug] = value;
              return object;
            }, {});
        });
      });

      return {
        ...state,
        ...payload,
        loading: false,
        categories,
      };
    case CATEGORIES_FAILED:
      return { ...initialState, ...payload, error: true };
    default:
      return state;
  }
}
