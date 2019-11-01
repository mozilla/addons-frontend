/* @flow */
import NotAuthorizedPage from 'amo/pages/ErrorPages/NotAuthorizedPage';
import NotFoundPage from 'amo/pages/ErrorPages/NotFoundPage';
import ServerErrorPage from 'amo/pages/ErrorPages/ServerErrorPage';

export function getErrorComponent(status: number | null) {
  switch (status) {
    case 401:
      return NotAuthorizedPage;
    case 404:
      return NotFoundPage;
    case 500:
    default:
      return ServerErrorPage;
  }
}
