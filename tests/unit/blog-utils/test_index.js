import * as cheerio from 'cheerio';

import { buildFooter, buildHeader, buildStaticAddonCard } from 'blog-utils';
import { fakeAddon } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('buildFooter', () => {
    it('returns the footer HTML', () => {
      const html = cheerio.load(buildFooter());

      expect(html('.Footer')).toHaveLength(1);
      expect(html('.Footer-language-picker')).toHaveLength(0);

      const blogLink = html('.Footer-blog-link');
      expect(blogLink).toHaveLength(1);
      expect(blogLink.attr('href')).toEqual('/blog/');
    });
  });

  describe('buildStaticAddonCard', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    const mockFetch = (jsonData = {}) => {
      return jest.spyOn(global, 'fetch').mockResolvedValue({
        json: jest.fn().mockResolvedValue(jsonData),
      });
    };

    it('calls the API to fetch an add-on', async () => {
      const addonId = 123;
      const fetch = mockFetch({ ...fakeAddon, id: addonId });

      await buildStaticAddonCard({ addonId });

      expect(fetch).toHaveBeenCalledWith(
        `https://addons.mozilla.org/api/v5/addons/addon/${addonId}/?lang=en-US&app=firefox`,
      );
    });

    it('renders a StaticAddonCard', async () => {
      const addonId = 123;
      mockFetch({ ...fakeAddon, id: addonId });

      const html = cheerio.load(await buildStaticAddonCard({ addonId }));

      // addons-blog relies on these class names to update the card and make it
      // "dynamic" so they shouldn't be changed without considerations.
      expect(html('.StaticAddonCard')).toHaveLength(1);
      expect(html('.GetFirefoxButton')).toHaveLength(1);
      expect(html('.GetFirefoxButton-button')).toHaveLength(1);
    });

    it('lets the caller catch and handle errors', async () => {
      const addonId = 123;
      const anError = new Error('error in json()');
      jest.spyOn(global, 'fetch').mockResolvedValue({
        json: () => {
          throw anError;
        },
      });

      await expect(buildStaticAddonCard({ addonId })).rejects.toEqual(anError);
    });
  });

  describe('buildHeader', () => {
    it('returns the header HTML', () => {
      const html = cheerio.load(buildHeader());

      expect(html('.Header')).toHaveLength(1);
      // addons-blog relies on these class names to open/close the "More..."
      // menu so they shouldn't be changed without considerations.
      expect(html('.DropdownMenu')).toHaveLength(1);
      expect(html('.DropdownMenu-button')).toHaveLength(1);
      expect(html('.DropdownMenu-items')).toHaveLength(1);
    });
  });
});
