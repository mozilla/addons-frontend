// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { put, takeEvery } from 'redux-saga/effects';

import { FETCH_GUIDE_TEXT, setGuideText } from 'amo/reducers/guides';
import log from 'core/logger';
import { createErrorHandler } from 'core/sagas/utils';

export function* fetchGuideText({ payload: { guideSlug, errorHandlerId } }) {
  const errorHandler = createErrorHandler(errorHandlerId);
  try {
    const response = yield import(`amo/guides/${guideSlug}.md`);
    yield put(setGuideText({ text: response }));
  } catch (error) {
    log.warn('Guide failed to load:', error);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* guideTextSaga() {
  yield takeEvery(FETCH_GUIDE_TEXT, fetchGuideText);
}
