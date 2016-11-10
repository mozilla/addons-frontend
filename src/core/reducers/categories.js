import config from 'config';

import {
  CATEGORIES_GET,
  CATEGORIES_LOAD,
  CATEGORIES_FAILED,
} from 'core/constants';


export function emptyCategoryList() {
  const categoryList = {};
  config.get('validClientApplications').forEach((appName) => {
    categoryList[appName] = {};
  });
  return categoryList;
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

        categoryList[result.application][result.type].push({
          ...result,
          // count: 0,
          // page: null,
          // results: [],
        });
      });

      config.get('validClientApplications').forEach((appName) => {
        Object.keys(categoryList[appName]).forEach((addonType) => {
          categoryList[appName][addonType] = categoryList[appName][addonType]
            .sort((a, b) => a.name > b.name)
            .reduce((object, value) => {
              // eslint-disable-next-line no-param-reassign
              object[value.slug] = value;
              return object;
            }, {});
        });
      });

      return {
        ...state,
        ...payload,
        loading: false,
        categoryList,
      };
    case CATEGORIES_FAILED:
      return { ...initialState, ...payload, error: true };
    default:
      return state;
  }
}
