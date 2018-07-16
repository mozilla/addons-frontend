import { sanitizeHTMLWithExternalLinks } from 'disco/utils';

describe(__filename, () => {
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
