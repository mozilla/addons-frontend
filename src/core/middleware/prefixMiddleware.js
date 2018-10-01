import { oneLine } from 'common-tags';
import config from 'config';

import {
  getClientApp,
  isValidClientApp,
  isValidClientAppUrlException,
  isValidLocaleUrlException,
} from 'core/utils';
import { getLanguage, isValidLang } from 'core/i18n/utils';
import log from 'core/logger';

export function prefixMiddleware(req, res, next, { _config = config } = {}) {
  // Split on slashes after removing the leading slash.
  const URLParts = req.originalUrl.replace(/^\//, '').split('/');
  log.debug(URLParts);

  // Get lang and app parts from the URL. At this stage they may be incorrect
  // or missing.
  const [langFromURL, appFromURL] = URLParts;

  // Get language from URL or fall-back to detecting it from accept-language
  // header.
  const acceptLanguage = req.headers['accept-language'];
  const { lang, isLangFromHeader } = getLanguage({
    lang: langFromURL,
    acceptLanguage,
  });
  // Get the application from the UA if one wasn't specified in the URL (or
  // if it turns out to be invalid).
  const application = getClientApp(req.headers['user-agent']);
  // clientApp values that are allowed through to the router
  // TODO: This can be removed when we upgrade to react-router v4.
  const clientAppRoutes = _config.get('clientAppRoutes');

  const hasValidLang = isValidLang(langFromURL);
  const hasValidLocaleException = isValidLocaleUrlException(appFromURL, {
    _config,
  });
  const hasValidClientApp = isValidClientApp(appFromURL, { _config });
  let hasValidClientAppUrlException = isValidClientAppUrlException(appFromURL, {
    _config,
  });

  let isApplicationFromHeader = false;
  let prependedOrMovedApplication = false;

  if (hasValidLocaleException) {
    log.info(oneLine`Second part of URL is a locale exception (${URLParts[1]});
      make sure the clientApp is valid`);

    // Normally we look for a clientApp in the second part of a URL, but URLs
    // that match a locale exception don't have a locale so we look for the
    // clientApp in the first part of the URL.
    if (!isValidClientApp(langFromURL, { _config })) {
      URLParts[0] = application;
      isApplicationFromHeader = true;
      prependedOrMovedApplication = true;
    }
  } else if (
    (hasValidLang && langFromURL !== lang) ||
    hasValidClientApp ||
    hasValidClientAppUrlException
  ) {
    // Replace the first part of the URL if:
    // * It's valid and we've mapped it e.g: pt -> pt-PT.
    // * The lang is invalid but we have a valid application
    //   e.g. /bogus/firefox/.
    log.info(`Replacing lang in URL ${URLParts[0]} -> ${lang}`);
    URLParts[0] = lang;
  } else if (isValidLocaleUrlException(URLParts[0], { _config })) {
    log.info(`Prepending clientApp to URL: ${application}`);
    URLParts.splice(0, 0, application);
    isApplicationFromHeader = true;
    prependedOrMovedApplication = true;
  } else if (!hasValidLang) {
    // If lang wasn't valid or was missing prepend one.
    log.info(`Prepending lang to URL: ${lang}`);
    URLParts.splice(0, 0, lang);
    // If we've prepended the lang to the URL we need to re-check our
    // URL exception and make sure it's valid.
    hasValidClientAppUrlException = isValidClientAppUrlException(URLParts[1], {
      _config,
    });
  }

  if (!hasValidClientApp && isValidClientApp(URLParts[1], { _config })) {
    // We skip prepending an app if we'd previously prepended a lang and the
    // 2nd part of the URL is now a valid app.
    log.info('Application in URL is valid following prepending a lang.');
  } else if (prependedOrMovedApplication) {
    log.info(
      'URL is valid because we added/changed the first part to a clientApp.',
    );
  } else if (hasValidLocaleException || hasValidClientAppUrlException) {
    if (
      clientAppRoutes.includes(URLParts[1]) === false &&
      (hasValidLang || hasValidLocaleException)
    ) {
      log.info('Exception in URL found; we fallback to addons-server.');
      // TODO: Remove this once upgraded to react-router 4.
      res.status(404).end(oneLine`This page does not exist in addons-frontend.
        Returning 404; this error should trigger upstream (usually
        addons-server) to return a valid response.`);
      return next();
    }
    log.info('Exception in URL found; prepending lang to URL.');
  } else if (!hasValidClientApp) {
    // If the app supplied is not valid we need to prepend one.
    log.info(`Prepending application to URL: ${application}`);
    URLParts.splice(1, 0, application);
    isApplicationFromHeader = true;
  }

  // Redirect to the new URL.
  // For safety we'll deny a redirect to a URL starting with '//' since
  // that will be treated as a protocol-free URL.
  const newURL = `/${URLParts.join('/')}`;
  if (newURL !== req.originalUrl && !newURL.startsWith('//')) {
    // Collect vary headers to apply to the redirect
    // so we can make it cacheable.
    // TODO: Make the redirects cacheable by adding expires headers.
    if (isLangFromHeader) {
      res.vary('accept-language');
    }
    if (isApplicationFromHeader) {
      res.vary('user-agent');
    }
    return res.redirect(301, newURL);
  }

  // Add the data to res.locals to be utilised later.
  /* eslint-disable no-param-reassign */
  const [newLang, newApp] = URLParts;
  res.locals.lang = newLang;
  // The newApp part of the URL might not be a client application
  // so it's important to re-check that here before assuming it's good.
  res.locals.clientApp = isValidClientApp(newApp) ? newApp : application;
  // Get detailed info on the current user agent so we can make sure add-ons
  // are compatible with the current clientApp/version combo.
  res.locals.userAgent = req.headers['user-agent'];
  /* eslint-enable no-param-reassign */

  return next();
}
