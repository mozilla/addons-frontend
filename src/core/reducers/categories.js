/* @flow */
import { oneLine } from 'common-tags';
import config from 'config';
import invariant from 'invariant';

import { ADDON_TYPE_THEME, validAddonTypes } from 'core/constants';
import log from 'core/logger';

export const CATEGORIES_FETCH: 'CATEGORIES_FETCH' = 'CATEGORIES_FETCH';
export const CATEGORIES_LOAD: 'CATEGORIES_LOAD' = 'CATEGORIES_LOAD';

// See: https://addons-server.readthedocs.io/en/latest/topics/api/categories.html#category-list
type ExternalCategory = {|
  id: string,
  name: string,
  slug: string,
  application: string,
  misc: boolean,
  type: string,
  weight: number,
  description: string | null,
|};

// The absence of strict types is wanted because the logic in the reducer is a
// mess...
type CategoryListType = {
  [appName: string]: {
    [addonType: string]: {
      [addonSlug: string]: ExternalCategory,
    },
  },
};

export type CategoriesState = {|
  categories: null | CategoryListType,
  loading: boolean,
|};

export const initialState: CategoriesState = {
  categories: null,
  loading: false,
};

type CategoriesFetchParams = {|
  errorHandlerId: string,
|};

export type CategoriesFetchAction = {|
  type: typeof CATEGORIES_FETCH,
  payload: CategoriesFetchParams,
|};

export function categoriesFetch({
  errorHandlerId,
}: CategoriesFetchParams): CategoriesFetchAction {
  invariant(errorHandlerId, 'errorHandlerId is required');

  return {
    type: CATEGORIES_FETCH,
    payload: { errorHandlerId },
  };
}

type CategoriesLoadParams = {|
  results: Array<ExternalCategory>,
|};

type CategoriesLoadAction = {|
  type: typeof CATEGORIES_LOAD,
  payload: CategoriesLoadParams,
|};

export function categoriesLoad({
  results,
}: CategoriesLoadParams): CategoriesLoadAction {
  return {
    type: CATEGORIES_LOAD,
    payload: { results },
  };
}

type EmptyCategoryListType = {|
  [appName: string]: {|
    [addonType: string]: Array<ExternalCategory>,
  |},
|};

export function createEmptyCategoryList(): EmptyCategoryListType {
  return config.get('validClientApplications').reduce((object, appName) => {
    return {
      ...object,
      [appName]: validAddonTypes.reduce((appObject, addonType) => {
        // This is where we define an `EmptyCategoryListType` and not a
        // `CategoryListType`, because `[addonType]` is initialized with an
        // empty array.
        return { ...appObject, [addonType]: [] };
      }, {}),
    };
  }, {});
}

type Action = CategoriesFetchAction | CategoriesLoadAction;

export default function reducer(
  state: CategoriesState = initialState,
  action: Action,
): CategoriesState {
  switch (action.type) {
    case CATEGORIES_FETCH:
      return { ...initialState, loading: true };
    case CATEGORIES_LOAD: {
      const { payload } = action;

      const categoryList = createEmptyCategoryList();

      payload.results.forEach((category) => {
        // This category has no data, so skip it.
        if (!category || !category.application) {
          // eslint-disable-next-line amo/only-log-strings
          log.warn('category or category.application was false-y', category);
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

      const categories: CategoryListType = {};
      Object.keys(categoryList).forEach((appName) => {
        categories[appName] = {};

        Object.keys(categoryList[appName]).forEach((addonType) => {
          categories[appName][addonType] = categoryList[appName][addonType]
            .sort((a, b) => a.name.localeCompare(b.name))
            .reduce(
              (object, value) => ({ ...object, [value.slug]: value }),
              {},
            );
        });
      });

      // Android doesn't have any theme categories but because all lightweight
      // themes (personas) are installable on Firefox Desktop and Android we
      // share categories and themes across clientApps.
      // See: https://github.com/mozilla/addons-frontend/issues/2170
      //
      // TODO: Remove this code once
      // https://github.com/mozilla/addons-server/issues/4766 is fixed.
      log.info(oneLine`Replacing Android persona data with Firefox data until
          https://github.com/mozilla/addons-server/issues/4766 is fixed.`);
      categories.android[ADDON_TYPE_THEME] =
        categories.firefox[ADDON_TYPE_THEME];

      return {
        categories,
        loading: false,
      };
    }
    default:
      return state;
  }
}
