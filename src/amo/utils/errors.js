/* @flow */
import NotAuthorized from 'amo/components/ErrorPage/NotAuthorized';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ServerError from 'amo/components/ErrorPage/ServerError';

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
