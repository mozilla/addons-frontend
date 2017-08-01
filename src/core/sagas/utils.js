import { ErrorHandler } from 'core/errorHandler';
import defaultLog from 'core/logger';


export function createErrorHandler(id, { log = defaultLog } = {}) {
  return new ErrorHandler({
    id,
    // Make sure the dispatch() method can't be used. A saga will yield
    // put(action) instead so this shouldn't cause a problem.
    dispatch: () => log.error('ErrorHandler cannot dispatch from a saga'),
  });
}

// Convenience function to extract state info.
export function getState(state) {
  return state;
}
