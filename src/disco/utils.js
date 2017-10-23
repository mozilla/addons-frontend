import { sanitizeHTML } from 'core/utils';
import purify from 'disco/purify';


export const sanitizeHTMLWithNewTabLinks = (text, allowTags = []) => {
  return sanitizeHTML(text, allowTags, purify);
};
