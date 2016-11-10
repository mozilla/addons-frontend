import config from 'config';

import {
  CATEGORIES_GET,
  CATEGORIES_LOAD,
  CATEGORIES_FAILED,
} from 'core/constants';


export function emptyCategoryList() {
  return config.get('validClientApplications')
    .reduce((object, appName) => ({ ...object, [appName]: {} }), {});
}

const initialState = {
  categories: emptyCategoryList(),
  error: false,
  loading: false,
};

export default function categories(state = initialState, action) {
  const { payload } = action;
  let categoryList;

  switch (action.type) {
    case CATEGORIES_GET:
      return { ...state, ...payload, loading: true };
    case CATEGORIES_LOAD:
      categoryList = emptyCategoryList();
      payload.result.forEach((result) => {
        // If the API returns data for an application we don't support,
        // we'll ignore it for now.
        if (!categoryList[result.application]) {
          return;
        }

        if (!categoryList[result.application][result.type]) {
          categoryList[result.application][result.type] = [];
        }

        categoryList[result.application][result.type].push(result);
      });

      Object.keys(categoryList).forEach((appName) => {
        Object.keys(categoryList[appName]).forEach((addonType) => {
          categoryList[appName][addonType] = categoryList[appName][addonType]
            .sort((a, b) => a.name >= b.name)
            .reduce((object, value) => (
              { ...object, [value.slug]: value }
            ), {});
        });
      });

      return {
        ...state,
        ...payload,
        loading: false,
        categories: categoryList,
      };
    case CATEGORIES_FAILED:
      return { ...initialState, ...payload, error: true };
    default:
      return state;
  }
}
