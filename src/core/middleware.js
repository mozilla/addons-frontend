import { getClientApp, isValidClientApp } from 'core/utils';
import { getLanguage, isValidLang } from 'core/i18n/utils';
import config from 'config';
import log from 'core/logger';


export function prefixMiddleWare(req, res, next, { _config = config } = {}) {
  // Split on slashes after removing the leading slash.
  const URLParts = req.originalUrl.replace(/^\//, '').split('/');
  log.debug(URLParts);

  // Get lang and app parts from the URL. At this stage they may be incorrect
  // or missing.
  const [langFromURL, appFromURL] = URLParts;

  // Get language from URL or fall-back to detecting it from accept-language header.
  const acceptLanguage = req.headers['accept-language'];
  const { lang, isLangFromHeader } = getLanguage({ lang: langFromURL, acceptLanguage });

  const hasValidLang = isValidLang(langFromURL);
  const hasValidClientApp = isValidClientApp(appFromURL, { _config });

  let prependedLang = false;

  if ((hasValidLang && langFromURL !== lang) ||
      (!hasValidLang && hasValidClientApp)) {
    // Replace the first part of the URL if:
    // * It's valid and we've mapped it e.g: pt -> pt-PT.
    // * The lang is invalid but we have a valid application
    //   e.g. /bogus/firefox/.
    log.info(`Replacing lang in URL ${URLParts[0]} -> ${lang}`);
    URLParts[0] = lang;
  } else if (!hasValidLang) {
    // If lang wasn't valid or was missing prepend one.
    log.info(`Prepending lang to URL: ${lang}`);
    URLParts.splice(0, 0, lang);
    prependedLang = true;
  }

  let isApplicationFromHeader = false;

  if (!hasValidClientApp && prependedLang &&
      isValidClientApp(URLParts[1], { _config })) {
    // We skip prepending an app if we'd previously prepended a lang and the
    // 2nd part of the URL is now a valid app.
    log.info('Application in URL is valid following prepending a lang.');
  } else if (!hasValidClientApp) {
    // If the app supplied is not valid we need to prepend one.
    const application = getClientApp(req.headers['user-agent']);
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
    const varyHeaders = [];
    if (isLangFromHeader) {
      varyHeaders.push('accept-language');
    }
    if (isApplicationFromHeader) {
      varyHeaders.push('user-agent');
    }
    res.set('vary', varyHeaders);
    return res.redirect(302, newURL);
  }

  // Add the data to res.locals to be utilised later.
  /* eslint-disable no-param-reassign */
  const [newLang, newApp] = URLParts;
  res.locals.lang = newLang;
  res.locals.clientApp = newApp;
  /* eslint-enable no-param-reassign */

  return next();
}
