/* @flow */
/* global window */
import config from 'config';
import { createMemoryHistory } from 'history';
import * as React from 'react';
import {
  applyMiddleware,
  compose,
  createStore as defaultCreateStore,
  combineReducers,
} from 'redux';
import createSagaMiddleware from 'redux-saga';
import {
  connectRouter,
  routerMiddleware as defaultRouterMiddleware,
} from 'connected-react-router';
import { createLogger } from 'redux-logger';

import addonsByAuthors from 'amo/reducers/addonsByAuthors';
import collections from 'amo/reducers/collections';
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
import type { AddonsByAuthorsState } from 'amo/reducers/addonsByAuthors';
import type { BlocksState } from 'amo/reducers/blocks';
import type { CollectionsState } from 'amo/reducers/collections';
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
import type { ReactRouterHistoryType, LocationType } from 'amo/types/router';
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
  _applyMiddleware = applyMiddleware,
  _config = config,
  _createLogger = createLogger,
  _minimalReduxLogger = minimalReduxLogger,
  _window = typeof window !== 'undefined' ? window : null,
  sagaMiddleware = null,
  routerMiddleware = null,
}: {
  _applyMiddleware?: typeof applyMiddleware,
  _config?: typeof config,
  _createLogger?: typeof createLogger,
  _minimalReduxLogger?: typeof minimalReduxLogger,
  _window?: typeof window | null,
  sagaMiddleware?: Object | null,
  routerMiddleware?: Object | null,
} = {}): React.ComponentType<any> {
  const isDev = _config.get('isDevelopment');

  const callbacks = [];
  if (isDev) {
    // Log all Redux actions but only when in development.
    if (_config.get('server')) {
      // Use a minimal logger while on the server.
      callbacks.push(_minimalReduxLogger);
    } else {
      // Use the full logger while on the client.
      callbacks.push(_createLogger());
    }
  }
  if (sagaMiddleware) {
    callbacks.push(sagaMiddleware);
  }
  if (routerMiddleware) {
    callbacks.push(routerMiddleware);
  }

  return compose(
    _applyMiddleware(...callbacks),
    _config.get('enableDevTools') &&
      _window &&
      _window.__REDUX_DEVTOOLS_EXTENSION__
      ? _window.__REDUX_DEVTOOLS_EXTENSION__()
      : (_createStore) => _createStore,
  );
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

type CreateRootReducerParams = {|
  history: ReactRouterHistoryType,
  reducers: AppReducersType,
|};

export const createRootReducer = ({
  history,
  reducers,
}: CreateRootReducerParams): AppState => {
  return combineReducers({
    ...reducers,
    router: connectRouter(history),
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
  uiState,
  userAbuseReports,
  users,
  versions,
  viewContext,
};

export default function createStore({
  history = createMemoryHistory(),
  initialState = {},
}: CreateStoreParams = {}): {| sagaMiddleware: Object, store: Object |} {
  const sagaMiddleware = createSagaMiddleware();
  const store = defaultCreateStore(
    createRootReducer({ history, reducers }),
    initialState,
    middleware({
      routerMiddleware: defaultRouterMiddleware(history),
      sagaMiddleware,
    }),
  );

  return { sagaMiddleware, store };
}
