/* @flow */
import { createMemoryHistory } from 'history';
import { createStore as _createStore, combineReducers } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { connectRouter, routerMiddleware } from 'connected-react-router';

import { middleware } from 'core/store';
import addons from 'core/reducers/addons';
import api from 'core/reducers/api';
import errorPage from 'core/reducers/errorPage';
import errors from 'core/reducers/errors';
import infoDialog from 'core/reducers/infoDialog';
import installations from 'core/reducers/installations';
import redirectTo from 'core/reducers/redirectTo';
import survey from 'core/reducers/survey';
import telemetry from 'disco/reducers/telemetry';
import uiState from 'core/reducers/uiState';
import versions from 'core/reducers/versions';
import discoResults from 'disco/reducers/discoResults';
import type { AddonsState } from 'core/reducers/addons';
import type { ApiState } from 'core/reducers/api';
import type { ErrorPageState } from 'core/reducers/errorPage';
import type { InfoDialogState } from 'core/reducers/infoDialog';
import type { InstallationsState } from 'core/reducers/installations';
import type { RedirectToState } from 'core/reducers/redirectTo';
import type { SurveyState } from 'core/reducers/survey';
import type { TelemetryState } from 'disco/reducers/telemetry';
import type { UIStateState } from 'core/reducers/uiState';
import type { VersionsState } from 'core/reducers/versions';
import type { ReactRouterHistoryType } from 'core/types/router';
import type { CreateStoreParams, CreateReducerType } from 'core/types/store';
import type { DiscoResultsState } from 'disco/reducers/discoResults';

export type AppState = {|
  addons: AddonsState,
  api: ApiState,
  discoResults: DiscoResultsState,
  errorPage: ErrorPageState,
  errors: Object,
  infoDialog: InfoDialogState,
  installations: InstallationsState,
  redirectTo: RedirectToState,
  survey: SurveyState,
  telemetry: TelemetryState,
  uiState: UIStateState,
  versions: VersionsState,
|};

// Given AppState, create a type for all possible application reducers.
// See https://flow.org/en/docs/types/utilities/#toc-objmap
type AppReducersType = $ObjMap<AppState, CreateReducerType>;

export type CreateRootReducerParams = {|
  history: ReactRouterHistoryType,
  reducers: AppReducersType,
|};

export const createRootReducer = ({
  history,
  reducers,
}: CreateRootReducerParams) => {
  return combineReducers({
    ...reducers,
    router: connectRouter(history),
  });
};

export const reducers: AppReducersType = {
  addons,
  api,
  discoResults,
  errorPage,
  errors,
  infoDialog,
  installations,
  redirectTo,
  survey,
  telemetry,
  uiState,
  versions,
};

export default function createStore({
  history = createMemoryHistory(),
  initialState = {},
}: CreateStoreParams = {}) {
  const sagaMiddleware = createSagaMiddleware();
  const store = _createStore(
    createRootReducer({ history, reducers }),
    initialState,
    middleware({
      routerMiddleware: routerMiddleware(history),
      sagaMiddleware,
    }),
  );

  return { sagaMiddleware, store };
}
