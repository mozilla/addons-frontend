import { sanitizeHTMLWithNewTabLinks } from 'disco/utils';

describe('sanitizeHTMLWithNewTabLinks', () => {
  it('adds `target` and `rel` attributes to HTML "targetable" elements', () => {
    const html = '<a href="http://example.org">link</a>';
    expect(sanitizeHTMLWithNewTabLinks(html, ['a'])).toEqual({
      __html: [
        '<a href="http://example.org" target="_blank" rel="noopener noreferrer">',
        'link',
        '</a>',
      ].join(''),
    });
  });
});
