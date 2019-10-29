/* @flow */
import NotAuthorized from 'amo/components/Errors/NotAuthorized';
import NotFound from 'amo/components/Errors/NotFound';
import ServerError from 'amo/components/Errors/ServerError';

export function getErrorComponent(status: number | null) {
  switch (status) {
    case 401:
      return NotAuthorized;
    case 404:
      return NotFound;
    case 500:
    default:
      return ServerError;
  }
}
