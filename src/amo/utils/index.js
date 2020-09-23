/* @flow */
/* eslint camelcase: 0 */
import url from 'url';

import base62 from 'base62';
import config from 'config';

import { PROMOTED_ADDONS_SUMO_URL } from 'amo/constants';
import { makeQueryString } from 'core/api';
import { DEFAULT_UTM_SOURCE, DEFAULT_UTM_MEDIUM } from 'core/constants';

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
  utm_source = DEFAULT_UTM_SOURCE,
  utm_medium = DEFAULT_UTM_MEDIUM,
  utm_campaign = 'non-fx-button',
  utm_content,
}: {|
  utm_source?: string,
  utm_medium?: string,
  utm_campaign?: string | null,
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

export const getPromotedBadgesLinkUrl = ({
  utm_content,
}: {|
  utm_content: string,
|}): string => {
  return `${PROMOTED_ADDONS_SUMO_URL}${makeQueryStringWithUTM({
    utm_campaign: null,
    utm_content,
  })}`;
};
