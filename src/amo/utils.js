/* eslint camelcase: 0 */
import base62Custom from 'base62/lib/custom';

import NotAuthorized from 'amo/components/ErrorPage/NotAuthorized';
import NotFound from 'amo/components/ErrorPage/NotFound';
import ServerError from 'amo/components/ErrorPage/ServerError';
import { makeQueryString } from 'core/api';


export function getErrorComponent(status) {
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

/*
 * Return a base62 object that encodes/decodes just like how Django does it
 * for cookie timestamps.
 *
 * See:
 * https://github.com/django/django/blob/0b9f366c60134a0ca2873c156b9c80acb7ffd8b5/django/core/signing.py#L180
 */
export function getDjangoBase62() {
  // This is the alphabet used by Django.
  const charset = base62Custom.indexCharset(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');
  return {
    encode: (int) => {
      return base62Custom.encode(int, charset);
    },
    decode: (str) => {
      return base62Custom.decode(str, charset);
    }
  }
}

export const makeQueryStringWithUTM = ({
  utm_source = 'addons.mozilla.org',
  utm_medium = 'referral',
  utm_campaign = 'non-fx-button',
  utm_content,
}) => {
  return makeQueryString({
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
  });
};
