// import {
//   CATEGORIES_GET,
//   CATEGORIES_LOAD,
//   CATEGORIES_FAILED,
// } from 'core/constants';

export function shouldShowError() {
  return {
    type: 'SHOULD_SHOW_ERROR',
    payload: {},
  };
}

export function clearAsyncConnectErrors() {
  return {
    type: 'SHOULD_NOT_SHOW_ERROR',
    payload: {},
  };
}
