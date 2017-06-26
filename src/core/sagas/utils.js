/* @flow */
import { ErrorHandler } from 'core/errorHandler';
import log from 'core/logger';
import type { ApiStateType } from 'core/reducers/api';

export function createErrorHandler(id: string): typeof ErrorHandler {
  return new ErrorHandler({
    id,
    // Make sure the dispatch() method can't be used. A saga will yield
    // put(action) instead so this shouldn't cause a problem.
    dispatch: () => log.error(
      'ErrorHandler cannot dispatch from a saga'),
  });
}

// Convenience function to extract API info.
export function getApi(state: {| api: ApiStateType |}): ApiStateType {
  return state.api;
}
