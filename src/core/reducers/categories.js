import { oneLine } from 'common-tags';
import config from 'config';

import {
  ADDON_TYPE_THEME,
  CATEGORIES_FETCH,
  CATEGORIES_LOAD,
  validAddonTypes,
} from 'core/constants';
import log from 'core/logger';

export function emptyCategoryList() {
  return config.get('validClientApplications').reduce((object, appName) => {
    return {
      ...object,
      [appName]: validAddonTypes.reduce((appObject, addonType) => {
        return { ...appObject, [addonType]: [] };
      }, {}),
    };
  }, {});
}

export const initialState = {
  categories: null,
  loading: false,
};

export default function categories(state = initialState, action) {
  const { payload } = action;

  switch (action.type) {
    case CATEGORIES_FETCH:
      return { ...initialState, loading: true };
    case CATEGORIES_LOAD: {
      const categoryList = emptyCategoryList();
      Object.values(payload.results).forEach((category) => {
        // This category has no data, so skip it.
        if (!category || !category.application) {
          log.warn('category or category.application was false-y.', category);
          return;
        }

        // If the API returns data for an application we don't support,
        // we'll ignore it for now.
        if (!categoryList[category.application]) {
          log.warn(oneLine`Category data for unknown clientApp
              "${category.application}" received from API.`);
          return;
        }

        if (!categoryList[category.application][category.type]) {
          log.warn(oneLine`add-on category for unknown add-on type
              "${category.type}" for clientApp "${category.type}" received
              from API.`);
          return;
        }

        categoryList[category.application][category.type].push(category);
      });

      Object.keys(categoryList).forEach((appName) => {
        Object.keys(categoryList[appName]).forEach((addonType) => {
          categoryList[appName][addonType] = categoryList[appName][addonType]
            .sort((a, b) => a.name.localeCompare(b.name))
            .reduce(
              (object, value) => ({ ...object, [value.slug]: value }),
              {},
            );
        });
      });

      // Android doesn't have any theme categories but because all lightweight
      // themes (personas) are installable on Firefox Desktop and Android
      // we share categories and themes across clientApps.
      // See: https://github.com/mozilla/addons-frontend/issues/2170
      //
      // TODO: Remove this code once
      // https://github.com/mozilla/addons-server/issues/4766 is fixed.
      log.info(oneLine`Replacing Android persona data with Firefox data until
          https://github.com/mozilla/addons-server/issues/4766 is fixed.`);
      categoryList.android[ADDON_TYPE_THEME] =
        categoryList.firefox[ADDON_TYPE_THEME];

      return {
        ...state,
        ...payload,
        loading: false,
        categories: categoryList,
      };
    }
    default:
      return state;
  }
}
