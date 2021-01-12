/* @flow */
import { ErrorHandler } from 'amo/errorHandler';
import defaultLog from 'amo/logger';
import type { AppState } from 'amo/store';

type CreateErrorHandlerType = {| log: typeof defaultLog |};

export function createErrorHandler(
  id: string,
  { log = defaultLog }: CreateErrorHandlerType = {},
): typeof ErrorHandler {
  return new ErrorHandler({
    id,
    // Make sure the dispatch() method can't be used. A saga will yield
    // put(action) instead so this shouldn't cause a problem.
    dispatch: () => log.error('ErrorHandler cannot dispatch from a saga'),
  });
}

// Convenience function to extract state info.
export function getState(state: AppState): AppState {
  return state;
}
