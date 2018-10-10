/* eslint-disable react/prop-types */
import url from 'url';

import config from 'config';
import { AllHtmlEntities } from 'html-entities';
import invariant from 'invariant';
import qhistory from 'qhistory';
import { stringify, parse } from 'qs';

import {
  ADDON_TYPE_COMPLETE_THEME,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_THEME,
  ADDON_TYPE_THEMES,
  ADDON_TYPE_THEMES_FILTER,
  API_ADDON_TYPES_MAPPING,
  CATEGORY_COLORS,
  VISIBLE_ADDON_TYPES_MAPPING,
} from 'core/constants';
import { AddonTypeNotFound } from 'core/errors';
import log from 'core/logger';
import purify from 'core/purify';

export function getClientConfig(_config) {
  const clientConfig = {};
  for (const key of _config.get('clientConfigKeys')) {
    clientConfig[key] = _config.get(key);
  }
  return clientConfig;
}

export function convertBoolean(value) {
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
export function getClientApp(userAgentString) {
  // We are going to return android as the application if it's *any* android browser.
  // whereas the previous behaviour was to only return 'android' for FF Android.
  // This way we are showing more relevant content, and if we prompt for the user to download
  // firefox we can prompt them to download Firefox for Android.
  if (/android/i.test(userAgentString)) {
    return 'android';
  }
  return 'firefox';
}

export function isValidClientApp(value, { _config = config } = {}) {
  return _config.get('validClientApplications').includes(value);
}

export function sanitizeHTML(text, allowTags = [], _purify = purify) {
  // TODO: Accept tags to allow and run through dom-purify.
  return {
    __html: _purify.sanitize(text, { ALLOWED_TAGS: allowTags }),
  };
}

// Convert new lines to HTML breaks.
export function nl2br(text) {
  return (text || '').replace(/(\r\n|\r|\n)(?!<.+?>)/g, '<br />');
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
export function sanitizeUserHTML(text) {
  return sanitizeHTML(nl2br(text), [
    'a',
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
  ]);
}

export function isAddonAuthor({ addon, userId }) {
  if (!addon || !addon.authors || !addon.authors.length || !userId) {
    return false;
  }

  return addon.authors.some((author) => {
    return author.id === userId;
  });
}

export function isAllowedOrigin(
  urlString,
  { allowedOrigins = [config.get('amoCDN')] } = {},
) {
  let parsedURL;
  try {
    parsedURL = url.parse(urlString);
  } catch (e) {
    log.error(`invalid urlString provided to isAllowedOrigin: ${urlString}`);
    return false;
  }

  return allowedOrigins.includes(`${parsedURL.protocol}//${parsedURL.host}`);
}

/*
 * Returns a new URL with query params appended to `urlString`.
 *
 * `urlString` can be a relative or absolute URL.
 */
export function addQueryParams(urlString, queryParams = {}) {
  const urlObj = url.parse(urlString, true);
  // Clear search, since query object will only be used if search
  // property doesn't exist.
  urlObj.search = undefined;
  urlObj.query = { ...urlObj.query, ...queryParams };
  return url.format(urlObj);
}

export function apiAddonTypeIsValid(addonType) {
  return Object.prototype.hasOwnProperty.call(
    API_ADDON_TYPES_MAPPING,
    addonType,
  );
}

export function apiAddonType(addonType) {
  if (!apiAddonTypeIsValid(addonType)) {
    throw new AddonTypeNotFound(
      `"${addonType}" not found in API_ADDON_TYPES_MAPPING`,
    );
  }
  return API_ADDON_TYPES_MAPPING[addonType];
}

export function visibleAddonType(addonType) {
  if (
    !Object.prototype.hasOwnProperty.call(
      VISIBLE_ADDON_TYPES_MAPPING,
      addonType,
    )
  ) {
    throw new AddonTypeNotFound(
      `"${addonType}" not found in VISIBLE_ADDON_TYPES_MAPPING`,
    );
  }
  return VISIBLE_ADDON_TYPES_MAPPING[addonType];
}

export function removeProtocolFromURL(urlWithProtocol) {
  invariant(urlWithProtocol, 'urlWithProtocol is required');

  // `//test.com` is a valid, protocol-relative URL which we'll allow.
  return urlWithProtocol.replace(/^(https?:|)\/\//, '');
}

export function isValidLocaleUrlException(value, { _config = config } = {}) {
  return _config.get('validLocaleUrlExceptions').includes(value);
}

export function isValidClientAppUrlException(value, { _config = config } = {}) {
  return _config.get('validClientAppUrlExceptions').includes(value);
}

export function isValidTrailingSlashUrlException(
  value,
  { _config = config } = {},
) {
  return _config.get('validTrailingSlashUrlExceptions').includes(value);
}

/*
 * Make sure a callback returns a rejected promise instead of throwing an error.
 *
 * If the callback throws an error, a rejected promise will be returned
 * instead. If the callback runs without an error, its return value is not
 * altered. In other words, it may or may not return a promise and that's ok.
 */
export const safePromise = (callback) => (...args) => {
  try {
    return callback(...args);
  } catch (error) {
    return Promise.reject(error);
  }
};

export function trimAndAddProtocolToUrl(urlToCheck) {
  let urlToReturn = urlToCheck ? urlToCheck.trim() : null;
  if (urlToReturn && !urlToReturn.match(/^https?:\/\//)) {
    urlToReturn = `http://${urlToReturn}`;
  }
  return urlToReturn;
}

export function getCategoryColor(category) {
  if (!category) {
    throw new Error('category is required.');
  }

  const maxColors = CATEGORY_COLORS[category.type];

  if (!maxColors) {
    throw new Error(
      `addonType "${category.type}" not found in CATEGORY_COLORS.`,
    );
  }

  if (category.id > maxColors) {
    const color = parseInt(category.id / maxColors, 10);

    if (color > maxColors) {
      return maxColors;
    }

    return color;
  }

  return category.id;
}

export function addonHasVersionHistory(addon) {
  if (!addon) {
    throw new Error('addon is required');
  }

  return ![
    ADDON_TYPE_COMPLETE_THEME,
    ADDON_TYPE_OPENSEARCH,
    ADDON_TYPE_THEME,
  ].includes(addon.type);
}

/*
 * Decodes HTML entities into their respective symbols.
 */
export const decodeHtmlEntities = (string) => {
  const entities = new AllHtmlEntities();
  return entities.decode(string);
};

export const isTheme = (addonType) => {
  return ADDON_TYPE_THEMES.includes(addonType);
};

export const getAddonTypeFilter = (addonType) => {
  if (!isTheme(addonType)) {
    return addonType;
  }

  return ADDON_TYPE_THEMES_FILTER;
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
export const normalizeFileNameId = (filename) => {
  let fileId = filename;
  if (!fileId.startsWith('src')) {
    fileId = fileId.replace(/^.*src/, 'src');
  }

  return fileId;
};

export const getDisplayName = (component) => {
  return component.displayName || component.name || 'Component';
};

export const addQueryParamsToHistory = ({
  history,
  _parse = parse,
  _stringify = stringify,
}) => {
  return qhistory(history, _stringify, _parse);
};
