/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';

import {
  DELETE_USER_ACCOUNT,
  DELETE_USER_PICTURE,
  UPDATE_USER_ACCOUNT,
  FETCH_USER_ACCOUNT,
  FETCH_USER_NOTIFICATIONS,
  finishUpdateUserAccount,
  loadCurrentUserAccount,
  loadUserAccount,
  loadUserNotifications,
  unloadUserAccount,
} from 'amo/reducers/users';
import * as api from 'amo/api/users';
import { SET_AUTH_TOKEN } from 'core/constants';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type {
  CurrentUserAccountParams,
  UpdateUserAccountParams,
  UpdateUserNotificationsParams,
  UserApiParams,
  UserApiParamsWithUsername,
} from 'amo/api/users';
import type {
  DeleteUserAccountAction,
  DeleteUserPictureAction,
  FetchUserAccountAction,
  FetchUserNotificationsAction,
  UpdateUserAccountAction,
} from 'amo/reducers/users';
import type { SetAuthTokenAction } from 'core/actions';
import type { Saga } from 'core/types/sagas';

// This saga is not triggered by the UI but on the server side, hence do not
// have a `errorHandler`. We do not want to miss any error because it would
// mean no ways for the users to log in, so we let the errors bubble up.
export function* fetchCurrentUserAccount({
  payload,
}: SetAuthTokenAction): Saga {
  const { token } = payload;

  const state = yield select(getState);

  const params: CurrentUserAccountParams = {
    api: {
      ...state.api,
      token,
    },
  };

  const response = yield call(api.currentUserAccount, params);

  yield put(loadCurrentUserAccount({ user: response }));
}

export function* updateUserAccount({
  payload: {
    errorHandlerId,
    notifications,
    picture,
    pictureData,
    userFields,
    userId,
  },
}: UpdateUserAccountAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const userAccountParams: UpdateUserAccountParams = {
      api: state.api,
      picture,
      userId,
      ...userFields,
    };

    const user = yield call(api.updateUserAccount, userAccountParams);

    if (picture) {
      // The post-upload task (resize, etc.) is asynchronous so we set the
      // uploaded file before loading the user account in order to display the
      // latest picture.
      // See: https://github.com/mozilla/addons-frontend/issues/5252
      user.picture_url = pictureData;
    }

    yield put(loadUserAccount({ user }));

    if (Object.keys(notifications).length) {
      const params: UpdateUserNotificationsParams = {
        api: state.api,
        notifications,
        userId,
      };
      const allNotifications = yield call(api.updateUserNotifications, params);

      if (typeof notifications.announcements !== 'undefined') {
        // The Salesforce integration is asynchronous and takes a lot of time
        // so we set the notification to whatever the user has chosen,
        // otherwise we would display the wrong notification value.
        // See: https://github.com/mozilla/addons-frontend/issues/5219
        const index = allNotifications.findIndex(
          (notification) => notification.name === 'announcements',
        );
        if (index !== -1) {
          allNotifications[index].enabled = notifications.announcements;
          log.debug(
            'Optimistically set user value for "announcements" notification',
          );
        }
      }

      yield put(
        loadUserNotifications({
          notifications: allNotifications,
          username: user.username,
        }),
      );
    }
  } catch (error) {
    log.warn(`Could not update user account: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  } finally {
    yield put(finishUpdateUserAccount());
  }
}

export function* fetchUserAccount({
  payload: { errorHandlerId, username },
}: FetchUserAccountAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: UserApiParamsWithUsername = {
      api: state.api,
      username,
    };

    const user = yield call(api.userAccount, params);

    yield put(loadUserAccount({ user }));
  } catch (error) {
    log.warn(`User account failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export function* fetchUserNotifications({
  payload: { errorHandlerId, username },
}: FetchUserNotificationsAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const notifications = yield call(api.userNotifications, {
      api: state.api,
      username,
    });

    yield put(loadUserNotifications({ notifications, username }));
  } catch (error) {
    log.warn(`User notifications failed to load: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export function* deleteUserPicture({
  payload: { errorHandlerId, userId },
}: DeleteUserPictureAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: UserApiParams = {
      api: state.api,
      userId,
    };

    const user = yield call(api.deleteUserPicture, params);

    yield put(loadUserAccount({ user }));
  } catch (error) {
    log.warn(`Could not delete user picture: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export function* deleteUserAccount({
  payload: { errorHandlerId, userId },
}: DeleteUserAccountAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: UserApiParams = {
      api: state.api,
      userId,
    };

    yield call(api.deleteUserAccount, params);

    yield put(unloadUserAccount({ userId }));
  } catch (error) {
    log.warn(`Could not delete user account: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* usersSaga(): Saga {
  yield takeLatest(DELETE_USER_ACCOUNT, deleteUserAccount);
  yield takeLatest(DELETE_USER_PICTURE, deleteUserPicture);
  yield takeLatest(UPDATE_USER_ACCOUNT, updateUserAccount);
  yield takeLatest(FETCH_USER_ACCOUNT, fetchUserAccount);
  yield takeLatest(FETCH_USER_NOTIFICATIONS, fetchUserNotifications);
  yield takeLatest(SET_AUTH_TOKEN, fetchCurrentUserAccount);
}
