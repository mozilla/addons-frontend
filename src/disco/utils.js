/* eslint camelcase: 0 */
import { makeQueryString } from 'core/api';
import { sanitizeHTML } from 'core/utils';
import purify from 'disco/purify';

export const sanitizeHTMLWithExternalLinks = (text, allowTags = []) => {
  // This purify instance is configured with a hook to fix link targets.
  return sanitizeHTML(text, allowTags, purify);
};

export const makeQueryStringWithUTM = ({
  utm_source = 'discovery.addons.mozilla.org',
  utm_medium = 'firefox-browser',
  utm_content,
  ...otherParams
}) => {
  return makeQueryString({
    utm_source,
    utm_medium,
    utm_content,
    ...otherParams,
  });
};
