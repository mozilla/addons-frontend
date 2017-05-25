import { oneLine } from 'common-tags';

import { parseCSP } from './helpers';

describe('server test helpers', () => {
  describe('parseCSP', () => {
    it('parses the CSP header into an object', () => {
      const headerContent = oneLine`default-src 'none'; base-uri 'self'; child-src 'none';
        connect-src 'self' https://addons-dev-cdn.allizom.org 127.0.0.1:3001; form-action 'none';
        frame-src 'none'; img-src 'self' 127.0.0.1:3001; media-src
        https://addons-discovery.cdn.mozilla.net; object-src 'none'; script-src 'self'
        https://addons-dev-cdn.allizom.org 127.0.0.1:3001; style-src 'self' blob:
        'sha256-8VVSrUT/1AZpxCZNGwNROSnacmbseuppeBCace7a/Wc='; report-uri /__cspreport__`;
      const policy = parseCSP(headerContent);
      expect(policy.imgSrc).toEqual(["'self'", '127.0.0.1:3001']);
      expect(policy.styleSrc).toEqual(
        ["'self'", 'blob:', "'sha256-8VVSrUT/1AZpxCZNGwNROSnacmbseuppeBCace7a/Wc='"]
      );
      expect(policy.reportUri).toEqual(['/__cspreport__']);
    });
  });
});
