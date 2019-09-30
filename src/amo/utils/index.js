/* @flow */
/* eslint camelcase: 0 */
import url from 'url';

import base62 from 'base62';
import config from 'config';

import { makeQueryString } from 'core/api';
import { addQueryParams } from 'core/utils';

/*
 * Return a base62 object that encodes/decodes just like how Django does it
 * for cookie timestamps.
 *
 * See:
 * https://github.com/django/django/blob/0b9f366c60134a0ca2873c156b9c80acb7ffd8b5/django/core/signing.py#L180
 */
export function getDjangoBase62() {
  // This is the alphabet used by Django.
  base62.setCharacterSet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  );
  return base62;
}

export function getAddonURL(slug: string) {
  return `/addon/${slug}/`;
}

export const makeQueryStringWithUTM = ({
  utm_source = 'addons.mozilla.org',
  utm_medium = 'referral',
  utm_campaign = 'non-fx-button',
  utm_content,
}: {|
  utm_source?: string,
  utm_medium?: string,
  utm_campaign?: string,
  utm_content: string,
|}): string => {
  return makeQueryString({
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
  });
};

export const getCanonicalURL = ({
  _config = config,
  locationPathname,
}: {|
  _config?: typeof config,
  locationPathname: string,
|}): string => {
  return `${_config.get('baseURL')}${locationPathname}`;
};

export const checkInternalURL = ({
  _config = config,
  urlString,
}: {|
  _config?: typeof config,
  urlString: string,
|}): { isInternal: boolean, relativeURL: string } => {
  const baseURL = _config.get('baseURL');
  const urlParts = url.parse(urlString, true);
  const isRelative =
    // The double slash is for protocol-free URLs.
    urlString.startsWith('/') && !urlString.startsWith('//');
  const currentHost = url.parse(baseURL).host || '';
  const isForCurrentHost =
    currentHost === urlParts.host || urlString.startsWith(`//${currentHost}`);
  const isInternal = isRelative || isForCurrentHost;

  let relativeURL = urlString.startsWith(`//${currentHost}`)
    ? urlString.replace(`//${currentHost}`, '')
    : urlString.replace(baseURL, '');
  if (isInternal && !relativeURL.startsWith('/')) {
    relativeURL = `/${relativeURL}`;
  }

  return {
    isInternal,
    relativeURL,
  };
};

type QueryParams = { [key: string]: any };

type AddParamsToHeroURLParams = {|
  _addQueryParams?: typeof addQueryParams,
  _config?: typeof config,
  _checkInternalURL?: typeof checkInternalURL,
  heroSrcCode: string,
  internalQueryParams?: QueryParams,
  externalQueryParams?: QueryParams,
  urlString: string,
|};

export const addParamsToHeroURL = ({
  _addQueryParams = addQueryParams,
  _config = config,
  _checkInternalURL = checkInternalURL,
  heroSrcCode,
  internalQueryParams = { src: heroSrcCode },
  externalQueryParams = {
    utm_content: heroSrcCode,
    utm_medium: 'referral',
    utm_source: url.parse(_config.get('baseURL')).host,
  },
  urlString,
}: AddParamsToHeroURLParams) => {
  return _addQueryParams(
    urlString,
    _checkInternalURL({ urlString }).isInternal
      ? internalQueryParams
      : externalQueryParams,
  );
};
