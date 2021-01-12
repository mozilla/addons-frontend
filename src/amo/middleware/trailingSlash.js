import config from 'config';

import { isValidClientApp, isValidTrailingSlashUrlException } from 'amo/utils';
import { isValidLang } from 'amo/i18n/utils';
import log from 'amo/logger';

export function trailingSlashesMiddleware(
  req,
  res,
  next,
  { _config = config } = {},
) {
  const UrlParts = req.originalUrl.split('?');
  const UrlSlashSeparated = UrlParts[0].replace(/^\//, '').split('/');

  // If part of this URL should include a lang or clientApp, check for one
  // and make sure they're valid.
  if (isValidLang(UrlSlashSeparated[0], { _config })) {
    UrlSlashSeparated[0] = '$lang';
  }
  if (isValidClientApp(UrlSlashSeparated[1], { _config })) {
    UrlSlashSeparated[1] = '$clientApp';
  } else if (isValidClientApp(UrlSlashSeparated[0], { _config })) {
    // It's possible there is a clientApp in the first part of the URL if this
    // URL is in validLocaleUrlExceptions.
    UrlSlashSeparated[0] = '$clientApp';
  }

  const urlToCheck = `/${UrlSlashSeparated.join('/')}`;

  // If the URL doesn't end with a trailing slash, and it isn't an exception,
  // we'll add a trailing slash.
  if (
    !isValidTrailingSlashUrlException(urlToCheck, { _config }) &&
    UrlParts[0].substr(-1) !== '/'
  ) {
    UrlParts[0] = `${UrlParts[0]}/`;
    return res.redirect(301, UrlParts.join('?'));
  }

  if (isValidTrailingSlashUrlException(urlToCheck, { _config })) {
    log.info(
      `Not adding a trailing slash; validTrailingSlashUrlException found: ${urlToCheck}`,
    );
  }

  return next();
}
