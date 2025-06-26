/* @flow */
import url from 'url';

import * as React from 'react';
import config from 'config';
import invariant from 'invariant';
import qhistory from 'qhistory';
import { stringify, parse } from 'qs';
import base62 from 'base62';

import { makeQueryString } from 'amo/api';
import { isValidLang } from 'amo/i18n/utils';
import {
  API_ADDON_TYPES_MAPPING,
  DEFAULT_UTM_MEDIUM,
  DEFAULT_UTM_SOURCE,
  DOWNLOAD_FIREFOX_UTM_CAMPAIGN,
  VISIBLE_ADDON_TYPES_MAPPING,
} from 'amo/constants';
import purify from 'amo/purify';
import type { AddonType } from 'amo/types/addons';

/*
 * Return a base62 object that encodes/decodes just like how Django does it
 * for cookie timestamps.
 *
 * See:
 * https://github.com/django/django/blob/0b9f366c60134a0ca2873c156b9c80acb7ffd8b5/django/amo/signing.py#L180
 */
export function getDjangoBase62(): typeof base62 {
  // This is the alphabet used by Django.
  base62.setCharacterSet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  );
  return base62;
}

export function getAddonURL(slug: string): string {
  return `/addon/${slug}/`;
}

// Note that this also accepts an arbitrary number of additional query params
// which are also added to the final querystring.
export const makeQueryStringWithUTM = ({
  utm_campaign = DOWNLOAD_FIREFOX_UTM_CAMPAIGN,
  utm_content = null,
  utm_medium = DEFAULT_UTM_MEDIUM,
  utm_source = DEFAULT_UTM_SOURCE,
  utm_term = null,
  ...otherQueryParams
}: {|
  utm_campaign?: string | null,
  utm_content?: string | null,
  utm_medium?: string,
  utm_source?: string,
  utm_term?: string | null,
  // otherQueryParams
  [string]: string | null,
|}): string => {
  return makeQueryString({
    ...otherQueryParams,
    utm_campaign,
    utm_content,
    utm_medium,
    utm_source,
    utm_term,
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

  // Treat blog URLs as external.
  const excludePathRegex = /^\/blog\//;
  const excludeFromInternal = excludePathRegex.test(urlParts.pathname || '');

  const isInternal = (isRelative || isForCurrentHost) && !excludeFromInternal;

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

export const stripLangFromAmoUrl = ({
  _checkInternalURL = checkInternalURL,
  urlString,
}: {
  _checkInternalURL?: typeof checkInternalURL,
  urlString: string,
}): string => {
  if (_checkInternalURL({ urlString }).isInternal) {
    const parsedUrl = url.parse(urlString, true);

    if (parsedUrl.pathname) {
      const pathParts = parsedUrl.pathname.split('/');
      const langPart = pathParts[1];
      if (isValidLang(langPart)) {
        return urlString.replace(`${langPart}/`, '');
      }
    }
  }

  return urlString;
};

export function getClientConfig(_config: typeof config): {
  [key: string]: mixed,
} {
  const clientConfig = {};
  for (const key of _config.get('clientConfigKeys')) {
    clientConfig[key] = _config.get(key);
  }
  return clientConfig;
}

export function convertBoolean(value: mixed): boolean {
  switch (value) {
    case true:
    case 1:
    case '1':
    case 'true':
      return true;
    default:
      return false;
  }
}

/*
 * This is a very simplistic check of the user-agent string in order to redirect to
 * the right set of AMO data.
 *
 * More complete UA detection for compatibility will take place elsewhere.
 *
 */
export function getClientApp(userAgentString: string): string {
  // We are going to return android as the application if it's *any* android browser.
  // whereas the previous behaviour was to only return 'android' for FF Android.
  // This way we are showing more relevant content, and if we prompt for the user to download
  // firefox we can prompt them to download Firefox for Android.
  if (/android/i.test(userAgentString)) {
    return 'android';
  }
  return 'firefox';
}

export function isValidClientApp(
  value: string,
  { _config = config }: { _config: typeof config } = {},
): boolean {
  return _config.get('validClientApplications').includes(value);
}

export function sanitizeHTML(
  text: ?string,
  allowTags: Array<string> = [],
  _purify: typeof purify = purify,
): {| __html: string |} {
  // TODO: Accept tags to allow and run through dom-purify.
  return {
    __html: _purify.sanitize(text, { ALLOWED_TAGS: allowTags }),
  };
}

// Convert new lines to HTML breaks.
export function nl2br(text: ?string): string {
  return (text || '').replace(/(\r\n|\r|\n)(?!<\/?(li|ul|ol)>)/g, '<br />');
}

/*
 * Sanitizes user inputted HTML, allowing some tags.
 *
 * This also converts new lines to breaks (<br />) as a convenience when
 * users did not write entirely in HTML.
 *
 * This is meant to display things like an add-on's description or version
 * release notes. The allowed tags are meant to match what you see in the
 * Developer Hub when you hover over the *Some HTML Supported* link under
 * the textarea field.
 */
export function sanitizeUserHTML(
  text: ?string,
  { allowLinks = true }: { allowLinks: boolean } = {},
): {| __html: string |} {
  const allowTags = [
    'abbr',
    'acronym',
    'b',
    'blockquote',
    'br',
    'code',
    'em',
    'i',
    'li',
    'ol',
    'strong',
    'ul',
  ];
  if (allowLinks === true) {
    allowTags.unshift('a');
  }
  return sanitizeHTML(nl2br(text), allowTags);
}

export function isAddonAuthor({
  addon,
  userId,
}: {|
  addon: AddonType | null,
  userId: string | number | null,
|}): boolean {
  if (!addon || !addon.authors || !addon.authors.length || !userId) {
    return false;
  }

  return addon.authors.some((author) => {
    return author.id === userId;
  });
}

export function apiAddonTypeIsValid(addonType: string): boolean {
  // $FlowFixMe: Deal with method-unbinding error.
  return Object.prototype.hasOwnProperty.call(
    API_ADDON_TYPES_MAPPING,
    addonType.toLowerCase(),
  );
}

export function apiAddonType(addonType: string): string {
  const lcasedAddonType = addonType.toLowerCase();
  if (!apiAddonTypeIsValid(lcasedAddonType)) {
    throw new Error(
      `"${lcasedAddonType}" not found in API_ADDON_TYPES_MAPPING`,
    );
  }
  return API_ADDON_TYPES_MAPPING[lcasedAddonType];
}

export function visibleAddonTypeIsValid(addonType: string): boolean {
  // $FlowFixMe: Deal with method-unbinding error.
  return Object.prototype.hasOwnProperty.call(
    VISIBLE_ADDON_TYPES_MAPPING,
    addonType.toLowerCase(),
  );
}

export function visibleAddonType(addonType: string): string {
  const lcasedAddonType = addonType.toLowerCase();
  if (!visibleAddonTypeIsValid(lcasedAddonType)) {
    throw new Error(
      `"${lcasedAddonType}" not found in VISIBLE_ADDON_TYPES_MAPPING`,
    );
  }
  return VISIBLE_ADDON_TYPES_MAPPING[lcasedAddonType];
}

export function removeProtocolFromURL(urlWithProtocol: string): string {
  invariant(urlWithProtocol, 'urlWithProtocol is required');

  // `//test.com` is a valid, protocol-relative URL which we'll allow.
  return urlWithProtocol.replace(/^(https?:|)\/\//, '');
}

export function isValidLocaleUrlException(
  value: string,
  { _config = config }: { _config?: typeof config } = {},
): boolean {
  return _config.get('validLocaleUrlExceptions').includes(value);
}

export function isValidClientAppUrlException(
  value: string,
  { _config = config }: { _config?: typeof config } = {},
): boolean {
  return _config.get('validClientAppUrlExceptions').includes(value);
}

export function isValidTrailingSlashUrlException(
  value: string,
  { _config = config }: { _config?: typeof config } = {},
): boolean {
  return _config.get('validTrailingSlashUrlExceptions').includes(value);
}

/*
 * Make sure a callback returns a rejected promise instead of throwing an error.
 *
 * If the callback throws an error, a rejected promise will be returned
 * instead. If the callback runs without an error, its return value is not
 * altered. In other words, it may or may not return a promise and that's ok.
 */
export const safePromise =
  (callback: Function): ((...args: any) => any | Promise<any>) =>
  (...args: any) => {
    try {
      return callback(...args);
    } catch (error) {
      return Promise.reject(error);
    }
  };

/*
 * Return an ID for a filename.
 *
 * This will normalize the representation of a filename on both client and
 * server. The result may not be a valid filename.
 *
 * We need this because the babel polyfill for `__filename` on the client
 * returns a relative path but `__filename` on the server returns an
 * absolute path.
 */
export const normalizeFileNameId = (filename: string): string => {
  let fileId = filename;
  if (!fileId.startsWith('src')) {
    fileId = fileId.replace(/^.*src/, 'src');
  }

  return fileId;
};

export const getDisplayName = (component: React.ComponentType<any>): string => {
  return component.displayName || component.name || 'Component';
};

export const addQueryParamsToHistory = ({
  history,
  _parse = parse,
  _stringify = stringify,
}: {|
  history: typeof history,
  _parse?: typeof parse,
  _stringify?: typeof stringify,
|}): typeof qhistory => {
  return qhistory(history, _stringify, _parse);
};

export const getClientAppAndLangFromPath = (
  urlString: string,
): {| lang: string, clientApp: string |} => {
  const URLParts = urlString.split('?');

  // Split on slashes after removing the leading slash.
  const URLPathParts = URLParts[0].replace(/^\//, '').split('/');

  // Get lang and app parts from the URL.
  return { lang: URLPathParts[0], clientApp: URLPathParts[1] };
};
