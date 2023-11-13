/* @flow */
/* global window */
import config from 'config';
import { createMemoryHistory } from 'history';
import { combineReducers } from 'redux';
import { createReduxHistoryContext } from 'redux-first-history';
import createSagaMiddleware from 'redux-saga';
import { createLogger } from 'redux-logger';
import { configureStore } from '@reduxjs/toolkit';

import addonsByAuthors from 'amo/reducers/addonsByAuthors';
import collections from 'amo/reducers/collections';
import collectionAbuseReports from 'amo/reducers/collectionAbuseReports';
import blocks from 'amo/reducers/blocks';
import experiments from 'amo/reducers/experiments';
import home from 'amo/reducers/home';
import landing from 'amo/reducers/landing';
import recommendations from 'amo/reducers/recommendations';
import reviews from 'amo/reducers/reviews';
import userAbuseReports from 'amo/reducers/userAbuseReports';
import users from 'amo/reducers/users';
import viewContext from 'amo/reducers/viewContext';
import abuse from 'amo/reducers/abuse';
import addons from 'amo/reducers/addons';
import api from 'amo/reducers/api';
import autocomplete from 'amo/reducers/autocomplete';
import categories from 'amo/reducers/categories';
import errors from 'amo/reducers/errors';
import errorPage from 'amo/reducers/errorPage';
import languageTools from 'amo/reducers/languageTools';
import installations from 'amo/reducers/installations';
import redirectTo from 'amo/reducers/redirectTo';
import search from 'amo/reducers/search';
import site from 'amo/reducers/site';
import uiState from 'amo/reducers/uiState';
import versions from 'amo/reducers/versions';
import log from 'amo/logger';
import suggestions from 'amo/reducers/suggestions';
import type { AddonsByAuthorsState } from 'amo/reducers/addonsByAuthors';
import type { BlocksState } from 'amo/reducers/blocks';
import type { CollectionsState } from 'amo/reducers/collections';
import type { CollectionAbuseReportsState } from 'amo/reducers/collectionAbuseReports';
import type { ExperimentsState } from 'amo/reducers/experiments';
import type { HomeState } from 'amo/reducers/home';
import type { LandingState } from 'amo/reducers/landing';
import type { RecommendationsState } from 'amo/reducers/recommendations';
import type { ReviewsState } from 'amo/reducers/reviews';
import type { UserAbuseReportsState } from 'amo/reducers/userAbuseReports';
import type { UsersState } from 'amo/reducers/users';
import type { ViewContextState } from 'amo/reducers/viewContext';
import type { AbuseState } from 'amo/reducers/abuse';
import type { AddonsState } from 'amo/reducers/addons';
import type { ApiState } from 'amo/reducers/api';
import type { AutocompleteState } from 'amo/reducers/autocomplete';
import type { CategoriesState } from 'amo/reducers/categories';
import type { ErrorPageState } from 'amo/reducers/errorPage';
import type { LanguageToolsState } from 'amo/reducers/languageTools';
import type { InstallationsState } from 'amo/reducers/installations';
import type { RedirectToState } from 'amo/reducers/redirectTo';
import type { SearchState } from 'amo/reducers/search';
import type { SiteState } from 'amo/reducers/site';
import type { UIStateState } from 'amo/reducers/uiState';
import type { VersionsState } from 'amo/reducers/versions';
import type { SuggestionsState } from 'amo/reducers/suggestions';
import type { LocationType } from 'amo/types/router';
import type { CreateStoreParams, CreateReducerType } from 'amo/types/store';

export const minimalReduxLogger =
  (): ((next: (action: Object) => Object) => (action: Object) => Object) =>
  (next: (action: Object) => Object) =>
  (action: Object) => {
    log.info(`Dispatching ${action.type}`);
    return next(action);
  };

/*
 * Enhance a redux store with common middleware.
 *
 * This returns a function that takes a single argument, `createStore`,
 * and returns a new `createStore` function.
 */
export function middleware({
  _config = config,
  _createLogger = createLogger,
  _minimalReduxLogger = minimalReduxLogger,
  sagaMiddleware = null,
  routerMiddleware = null,
}: {
  _config?: typeof config,
  _createLogger?: typeof createLogger,
  _minimalReduxLogger?: typeof minimalReduxLogger,
  _window?: typeof window | null,
  sagaMiddleware?: Object | null,
  routerMiddleware?: Object | null,
} = {}): any[] {
  const isDev = _config.get('isDevelopment');

  const middlewareToAdd = [];
  if (isDev) {
    // Log all Redux actions but only when in development.
    if (_config.get('server')) {
      // Use a minimal logger while on the server.
      middlewareToAdd.push(_minimalReduxLogger);
    } else {
      // Use the full logger while on the client.
      middlewareToAdd.push(_createLogger());
    }
  }
  if (sagaMiddleware) {
    middlewareToAdd.push(sagaMiddleware);
  }
  if (routerMiddleware) {
    middlewareToAdd.push(routerMiddleware);
  }

  return middlewareToAdd;
}

type InternalAppState = {|
  abuse: AbuseState,
  addons: AddonsState,
  addonsByAuthors: AddonsByAuthorsState,
  api: ApiState,
  autocomplete: AutocompleteState,
  blocks: BlocksState,
  categories: CategoriesState,
  collections: CollectionsState,
  collectionAbuseReports: CollectionAbuseReportsState,
  errorPage: ErrorPageState,
  errors: Object,
  experiments: ExperimentsState,
  home: HomeState,
  installations: InstallationsState,
  landing: LandingState,
  languageTools: LanguageToolsState,
  recommendations: RecommendationsState,
  redirectTo: RedirectToState,
  reviews: ReviewsState,
  search: SearchState,
  site: SiteState,
  suggestions: SuggestionsState,
  uiState: UIStateState,
  userAbuseReports: UserAbuseReportsState,
  users: UsersState,
  versions: VersionsState,
  viewContext: ViewContextState,
|};

export type AppState = {|
  ...InternalAppState,
  router: {|
    action: 'PUSH' | 'POP',
    location: LocationType,
  |},
|};

// Given AppState, create a type for all possible application reducers.
// See https://flow.org/en/docs/types/utilities/#toc-objmap
type AppReducersType = $ObjMap<InternalAppState, CreateReducerType>;

type CreateRootReducerParams = {| reducers: AppReducersType |};

export const createRootReducer = ({
  reducers,
}: CreateRootReducerParams): AppState => {
  const { routerReducer } = createReduxHistoryContext({
    history: createMemoryHistory(),
  });

  return combineReducers({
    ...reducers,
    router: routerReducer,
  });
};

export const reducers: AppReducersType = {
  abuse,
  addons,
  addonsByAuthors,
  api,
  autocomplete,
  blocks,
  categories,
  collections,
  collectionAbuseReports,
  errors,
  errorPage,
  experiments,
  home,
  installations,
  landing,
  languageTools,
  recommendations,
  redirectTo,
  reviews,
  search,
  site,
  suggestions,
  uiState,
  userAbuseReports,
  users,
  versions,
  viewContext,
};

export const includeDevTools = ({
  _config = config,
}: { _config?: typeof config } = {}): boolean => _config.get('enableDevTools');

export default function createStore({
  history = createMemoryHistory(),
  initialState = {},
}: CreateStoreParams = {}): {|
  connectedHistory: Object,
  sagaMiddleware: Object,
  store: Object,
|} {
  const sagaMiddleware = createSagaMiddleware();
  const { createReduxHistory, routerMiddleware } = createReduxHistoryContext({
    history,
  });

  const store = configureStore({
    reducer: createRootReducer({ reducers }),
    preloadedState: initialState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        middleware({
          routerMiddleware,
          sagaMiddleware,
        }),
      ),
    devTools: includeDevTools(),
  });

  return { connectedHistory: createReduxHistory(store), sagaMiddleware, store };
}
