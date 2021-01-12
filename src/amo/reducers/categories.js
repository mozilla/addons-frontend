/* @flow */
import { oneLine } from 'common-tags';
import config from 'config';
import invariant from 'invariant';

import { validAddonTypes } from 'amo/constants';
import log from 'amo/logger';

export const FETCH_CATEGORIES: 'FETCH_CATEGORIES' = 'FETCH_CATEGORIES';
export const LOAD_CATEGORIES: 'LOAD_CATEGORIES' = 'LOAD_CATEGORIES';

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

type CategoryMapType = {
  [appName: string]: {
    [addonType: string]: {
      [addonSlug: string]: ExternalCategory,
    },
  },
};

export type CategoriesState = {|
  categories: null | CategoryMapType,
  loading: boolean,
|};

export const initialState: CategoriesState = {
  categories: null,
  loading: false,
};

type FetchCategoriesParams = {|
  errorHandlerId: string,
|};

export type FetchCategoriesAction = {|
  type: typeof FETCH_CATEGORIES,
  payload: FetchCategoriesParams,
|};

export function fetchCategories({
  errorHandlerId,
}: FetchCategoriesParams): FetchCategoriesAction {
  invariant(errorHandlerId, 'errorHandlerId is required');

  return {
    type: FETCH_CATEGORIES,
    payload: { errorHandlerId },
  };
}

type LoadCategoriesParams = {|
  results: Array<ExternalCategory>,
|};

type LoadCategoriesAction = {|
  type: typeof LOAD_CATEGORIES,
  payload: LoadCategoriesParams,
|};

export function loadCategories({
  results,
}: LoadCategoriesParams): LoadCategoriesAction {
  return {
    type: LOAD_CATEGORIES,
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
      [appName]: validAddonTypes.reduce((appObject, addonType: string) => {
        return { ...appObject, [addonType]: [] };
      }, {}),
    };
  }, {});
}

type Action = FetchCategoriesAction | LoadCategoriesAction;

export default function reducer(
  state: CategoriesState = initialState,
  action: Action,
): CategoriesState {
  switch (action.type) {
    case FETCH_CATEGORIES:
      return { ...initialState, loading: true };
    case LOAD_CATEGORIES: {
      const { payload } = action;

      const categoryList = createEmptyCategoryList();

      payload.results.forEach((category) => {
        // This category has no data, so skip it.
        if (!category || !category.application) {
          // eslint-disable-next-line amo/only-log-strings
          log.warn('category or category.application was falsey: %o', category);
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

      const categories: CategoryMapType = {};
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

      return {
        categories,
        loading: false,
      };
    }
    default:
      return state;
  }
}
