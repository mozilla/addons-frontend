/* eslint camelcase: 0 */
import { makeQueryString } from 'core/api';
import {
  makeQueryStringWithUTM,
  sanitizeHTMLWithExternalLinks,
} from 'disco/utils';

describe(__filename, () => {
  describe('sanitizeHTMLWithExternalLinks', () => {
    it('adds `target` and `rel` attributes to HTML "targetable" elements', () => {
      const html = '<a href="http://example.org">link</a>';
      expect(sanitizeHTMLWithExternalLinks(html, ['a'])).toEqual({
        __html: [
          '<a href="http://example.org" target="_blank" rel="noopener noreferrer">',
          'link',
          '</a>',
        ].join(''),
      });
    });
  });

  describe('makeQueryStringWithUTM', () => {
    it('returns a valid query string', () => {
      const utm_content = 'utm-content';
      const queryString = makeQueryStringWithUTM({ utm_content });

      expect(queryString).toEqual(
        makeQueryString({
          utm_source: 'discovery.addons.mozilla.org',
          utm_medium: 'firefox-browser',
          utm_content,
        }),
      );
    });

    it('allows extra parameters', () => {
      const utm_content = 'utm-content';
      const src = 'api';
      const queryString = makeQueryStringWithUTM({ utm_content, src });

      expect(queryString).toContain(`&utm_content=${utm_content}&src=${src}`);
    });
  });
});
