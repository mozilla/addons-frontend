import { sanitizeHTML } from 'core/utils';
import purify from 'disco/purify';


export const sanitizeHTMLWithExternalLinks = (text, allowTags = []) => {
  // This purify instance is configured with a hook to fix link targets.
  return sanitizeHTML(text, allowTags, purify);
};
