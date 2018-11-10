/* @flow */
/* eslint camelcase: 0 */
import base62 from 'base62';
import config from 'config';
import invariant from 'invariant';

import { makeQueryString } from 'core/api';
import { CLIENT_APP_ANDROID } from 'core/constants';

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

export const shouldShowThemes = ({
  _config = config,
  clientApp,
}: {|
  _config?: typeof config,
  clientApp: string,
|}) => {
  invariant(clientApp, 'clientApp is required');

  return clientApp === CLIENT_APP_ANDROID
    ? _config.get('enableFeatureStaticThemesForAndroid')
    : true;
};
