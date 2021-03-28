import cheerio from 'cheerio';

import { buildFooter } from 'card';

describe(__filename, () => {
  describe('buildFooter', () => {
    it('returns the footer HTML', () => {
      const html = cheerio.load(buildFooter());

      expect(html('.Footer')).toHaveLength(1);
      expect(html('.Footer-language-picker')).toHaveLength(0);
    });
  });
});
