/* @flow */
import { ErrorHandler } from 'core/errorHandler';
import defaultLog from 'core/logger';
import type { ApiStateType } from 'core/reducers/api';


export function createErrorHandler(
  id: string,
  { log = defaultLog }: {| log: typeof defaultLog |} = {}
): typeof ErrorHandler {
  return new ErrorHandler({
    id,
    // Make sure the dispatch() method can't be used. A saga will yield
    // put(action) instead so this shouldn't cause a problem.
    dispatch: () => log.error('ErrorHandler cannot dispatch from a saga'),
  });
}

// Convenience function to extract state info.
export function getState(
  state: {| api: ApiStateType, auth: Object |}
): Object {
  return state;
}
