/* @flow */
import { oneLine } from 'common-tags';
import config from 'config';
import invariant from 'invariant';

import { validAddonTypes } from 'core/constants';
import log from 'core/logger';

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

export type CategorySlugType = {
  [addonSlug: string]: ExternalCategory,
};

type AddonCategories = {
  [appName: string]: Array<string>,
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

export const getCategories = (
  categoriesState: CategoryMapType,
  appName: string,
  addonType: string,
): Array<mixed> | null => {
  if (
    categoriesState &&
    categoriesState[appName] &&
    categoriesState[appName][addonType]
  ) {
    return Object.values(categoriesState[appName][addonType]);
  }
  return null;
};

export function getCategoryNames(
  categoriesState: CategoryMapType,
  addonCategories: AddonCategories,
  appName: string,
  addonType: string,
): Array<mixed> | null {
  invariant(categoriesState, 'categories state can not be empty!');
  invariant(addonCategories, 'slugs can not be empty!');
  invariant(appName, 'app name can not be empty!');
  invariant(addonType, 'addon type can not be empty!');

  const categories = getCategories(categoriesState, appName, addonType);

  const relatedCategories = [];

  if (categories && addonCategories && addonCategories[appName]) {
    categories.forEach((r) => {
      if (r && r.name && r.slug && addonCategories[appName].includes(r.slug)) {
        relatedCategories.push(r.name);
      }
    });
    return relatedCategories;
  }
  return null;
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
