import config from 'config';

import {
  getClientApp,
  isValidClientApp,
  isValidClientAppUrlException,
  isValidLocaleUrlException,
} from 'amo/utils';
import { getLanguage, isValidLang } from 'amo/i18n/utils';
import { ONE_YEAR_IN_SECONDS } from 'amo/constants';
import log from 'amo/logger';

export function prefixMiddleware(req, res, next, { _config = config } = {}) {
  const URLParts = req.originalUrl.split('?');

  // Split on slashes after removing the leading slash.
  const URLPathParts = URLParts[0].replace(/^\//, '').split('/');
  log.debug(`path: ${URLParts[0]}, URLPathParts: [${[URLPathParts]}]`);

  // Get the application from the UA in case one wasn't specified in the URL (or
  // if it turns out to be invalid).
  const userAgentApp = getClientApp(req.headers['user-agent']);
  let isApplicationFromHeader = false;
  // Get language from URL or fall-back to detecting it from accept-language
  // header.
  const acceptLanguage = req.headers['accept-language'];
  const { lang } = getLanguage({
    lang: URLPathParts[0],
    acceptLanguage,
  });
  let hasUnknownPartOne = false;

  const hasValidLang = isValidLang(URLPathParts[0]);
  const hasValidClientAppInPartOne = isValidClientApp(URLPathParts[0], {
    _config,
  });
  const hasValidClientAppInPartTwo = isValidClientApp(URLPathParts[1], {
    _config,
  });
  const hasValidClientAppUrlExceptionInPartTwo = isValidClientAppUrlException(
    URLPathParts[1],
    {
      _config,
    },
  );

  // "Fix" URLPathParts to always start /locale/clientApp/
  if (hasValidLang && hasValidClientAppInPartTwo) {
    log.debug('URL already has a valid lang and clientApp, nothing to fix');
  } else if (hasValidLang) {
    log.debug(`Prepending clientApp to URL: ${userAgentApp}`);
    URLPathParts.splice(1, 0, userAgentApp);
    isApplicationFromHeader = true;
  } else if (hasValidClientAppInPartOne) {
    log.debug(`Prepending lang to URL: ${lang}`);
    URLPathParts.splice(0, 0, lang);
  } else if (
    hasValidClientAppInPartTwo ||
    hasValidClientAppUrlExceptionInPartTwo
  ) {
    log.debug(`Replacing lang in URL: ${URLPathParts[0]} with ${lang}`);
    hasUnknownPartOne = true;
    URLPathParts.splice(0, 1, lang);
  } else {
    log.debug(`Prepending lang and clientApp to URL: ${lang}/${userAgentApp}`);
    hasUnknownPartOne = !!URLPathParts[0];
    URLPathParts.splice(0, 0, lang, userAgentApp);
    isApplicationFromHeader = true;
  }

  const hasValidLocaleException = isValidLocaleUrlException(URLPathParts[2], {
    _config,
  });
  const hasValidClientAppUrlException = isValidClientAppUrlException(
    URLPathParts[2],
    {
      _config,
    },
  );
  if (hasValidClientAppUrlException) {
    isApplicationFromHeader = false;
  }

  // Now drop lang and clientApp if required from URLPaths
  if (hasValidLocaleException && hasValidClientAppUrlException) {
    log.debug('URL is a locale and a clientApp exception.');
    URLPathParts.splice(0, 2);
  } else if (hasValidLocaleException) {
    log.debug('URL is a locale exception.');
    URLPathParts.splice(0, 1);
  } else if (hasValidClientAppUrlException) {
    log.debug('URL is a clientApp exception.');
    URLPathParts.splice(1, 1);
  }

  // Redirect to the new URL.
  // For safety we'll deny a redirect to a URL starting with '//' since
  // that will be treated as a protocol-free URL.
  URLParts[0] = `/${URLPathParts.join('/')}`;
  const newURL = URLParts.join('?');

  if (newURL !== req.originalUrl && !newURL.startsWith('//')) {
    // Collect vary headers to apply to the redirect
    // so we can make it cacheable.
    res.vary('accept-language');
    if (isApplicationFromHeader) {
      res.vary('user-agent');
    }
    res.set('Cache-Control', [`max-age=${ONE_YEAR_IN_SECONDS}`]);
    // If there was something at the beginning of the URL we didn't recognize,
    // it could be an old locale we have since disabled and might re-enable
    // later, so make the redirect temporary (302), otherwise permanent (301).
    return res.redirect(hasUnknownPartOne ? 302 : 301, newURL);
  }

  // Add the data to res.locals to be utilised later.
  /* eslint-disable no-param-reassign */
  const [newLang, newApp] = URLPathParts;
  res.locals.lang = newLang;
  // The newApp part of the URL might not be a client application
  // so it's important to re-check that here before assuming it's good.
  res.locals.clientApp = isValidClientApp(newApp) ? newApp : userAgentApp;
  // Get detailed info on the current user agent so we can make sure add-ons
  // are compatible with the current clientApp/version combo.
  res.locals.userAgent = req.headers['user-agent'];
  /* eslint-enable no-param-reassign */

  return next();
}
