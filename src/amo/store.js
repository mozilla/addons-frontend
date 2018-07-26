/* @flow */
import { createMemoryHistory } from 'history';
import { createStore as _createStore, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { connectRouter, routerMiddleware } from 'connected-react-router';

import addonsByAuthors from 'amo/reducers/addonsByAuthors';
import collections from 'amo/reducers/collections';
import home from 'amo/reducers/home';
import landing from 'amo/reducers/landing';
import recommendations from 'amo/reducers/recommendations';
import reviews from 'amo/reducers/reviews';
import userAbuseReports from 'amo/reducers/userAbuseReports';
import users from 'amo/reducers/users';
import viewContext from 'amo/reducers/viewContext';
import abuse from 'core/reducers/abuse';
import addons from 'core/reducers/addons';
import api from 'core/reducers/api';
import autocomplete from 'core/reducers/autocomplete';
import categories from 'core/reducers/categories';
import errors from 'core/reducers/errors';
import errorPage from 'core/reducers/errorPage';
import formOverlay from 'core/reducers/formOverlay';
import heroBanners from 'core/reducers/heroBanners';
import languageTools from 'core/reducers/languageTools';
import infoDialog from 'core/reducers/infoDialog';
import installations from 'core/reducers/installations';
import redirectTo from 'core/reducers/redirectTo';
import search from 'core/reducers/search';
import survey from 'core/reducers/survey';
import uiState from 'core/reducers/uiState';
import { middleware } from 'core/store';
import type { AddonsByAuthorsState } from 'amo/reducers/addonsByAuthors';
import type { CollectionsState } from 'amo/reducers/collections';
import type { HomeState } from 'amo/reducers/home';
import type { RecommendationsState } from 'amo/reducers/recommendations';
import type { ReviewsState } from 'amo/reducers/reviews';
import type { UserAbuseReportsState } from 'amo/reducers/userAbuseReports';
import type { UsersState } from 'amo/reducers/users';
import type { ViewContextState } from 'amo/reducers/viewContext';
import type { AbuseState } from 'core/reducers/abuse';
import type { AddonsState } from 'core/reducers/addons';
import type { ApiState } from 'core/reducers/api';
import type { ErrorPageState } from 'core/reducers/errorPage';
import type { FormOverlayState } from 'core/reducers/formOverlay';
import type { LanguageToolsState } from 'core/reducers/languageTools';
import type { InstallationsState } from 'core/reducers/installations';
import type { RedirectToState } from 'core/reducers/redirectTo';
import type { SearchState } from 'core/reducers/search';
import type { SurveyState } from 'core/reducers/survey';
import type { UIStateState } from 'core/reducers/uiState';
import type { ReactRouterHistoryType } from 'core/types/router';

export type AppState = {|
  abuse: AbuseState,
  addons: AddonsState,
  addonsByAuthors: AddonsByAuthorsState,
  api: ApiState,
  autocomplete: Object,
  categories: Object,
  collections: CollectionsState,
  errorPage: ErrorPageState,
  errors: Object,
  formOverlay: FormOverlayState,
  heroBanners: Object,
  home: HomeState,
  infoDialog: Object,
  installations: InstallationsState,
  landing: Object,
  languageTools: LanguageToolsState,
  recommendations: RecommendationsState,
  redirectTo: RedirectToState,
  reviews: ReviewsState,
  search: SearchState,
  survey: SurveyState,
  uiState: UIStateState,
  userAbuseReports: UserAbuseReportsState,
  users: UsersState,
  viewContext: ViewContextState,
|};

// This is a type function that takes a state type and returns a reducer
// type, i.e. a function that accepts and returns the same state type.
/* eslint-disable no-undef */
type CreateReducerType = <AnyState>(
  AnyState,
) => (AnyState, action: Object) => AnyState;
/* eslint-enable no-undef */

// Given AppState, create a type for all possible application reducers.
// See https://flow.org/en/docs/types/utilities/#toc-objmap
type AppReducersType = $ObjMap<AppState, CreateReducerType>;

type CreateStoreParams = {|
  history: ReactRouterHistoryType,
  initialState: Object,
|};

export default function createStore({
  history = createMemoryHistory(),
  initialState = {},
}: CreateStoreParams = {}) {
  const sagaMiddleware = createSagaMiddleware();
  const reducers: AppReducersType = {
    abuse,
    addons,
    addonsByAuthors,
    api,
    autocomplete,
    categories,
    collections,
    errors,
    errorPage,
    formOverlay,
    heroBanners,
    home,
    infoDialog,
    installations,
    landing,
    languageTools,
    recommendations,
    redirectTo,
    reviews,
    search,
    survey,
    uiState,
    userAbuseReports,
    users,
    viewContext,
  };
  const store = _createStore(
    connectRouter(history)(combineReducers(reducers)),
    initialState,
    middleware({
      routerMiddleware: routerMiddleware(history),
      sagaMiddleware,
    }),
  );

  return { sagaMiddleware, store };
}
