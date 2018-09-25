/* @flow */
/* global Generator */
// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
import invariant from 'invariant';
/* eslint-disable import/order */
import { call, put, select, takeEvery, takeLatest } from 'redux-saga/effects';
/* eslint-enable import/order */

import { SET_LATEST_REVIEW, SET_REVIEW } from 'amo/actions/reviews';
import { fetchAddon as fetchAddonFromApi } from 'core/api';
import {
  FETCH_ADDON,
  loadAddons,
  updateAddonRatings as updateAddonRatingsAction,
} from 'core/reducers/addons';
import log from 'core/logger';
import type { FetchAddonParams } from 'core/api';
import type { FetchAddonAction } from 'core/reducers/addons';
import type {
  SetLatestReviewAction,
  SetReviewAction,
} from 'amo/actions/reviews';

import { createErrorHandler, getState } from './utils';

export function* fetchAddon({
  payload: { errorHandlerId, slug },
}: FetchAddonAction): Generator<any, any, any> {
  const errorHandler = createErrorHandler(errorHandlerId);
  yield put(errorHandler.createClearingAction());
  try {
    const state = yield select(getState);

    const params: FetchAddonParams = { api: state.api, slug };
    const response = yield call(fetchAddonFromApi, params);

    yield put(loadAddons(response.entities));
  } catch (error) {
    log.warn(`Failed to load add-on with slug ${slug}: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export function* updateAddonRatings({
  payload,
}: SetLatestReviewAction | SetReviewAction): Generator<any, any, any> {
  const addonId = payload.addon ? payload.addon.id : payload.addonId;
  invariant(addonId, 'could not find an add-on ID in the action payload');

  try {
    const state = yield select(getState);

    const params: FetchAddonParams = { api: state.api, slug: addonId };
    const response = yield call(fetchAddonFromApi, params);

    // TODO: update the whole add-on. Why not?
    yield put(
      updateAddonRatingsAction({
        addonId,
        // TODO: this is dumb.
        ratings: Object.values(response.entities.addons)[0].ratings,
      }),
    );
  } catch (error) {
    log.warn(
      `Failed to update ratings with for add-on ID ${addonId}: ${error}`,
    );
  }
}

export default function* addonsSaga(): Generator<any, any, any> {
  yield takeEvery(FETCH_ADDON, fetchAddon);
  yield takeLatest(SET_REVIEW, updateAddonRatings);
  yield takeLatest(SET_LATEST_REVIEW, updateAddonRatings);
}
