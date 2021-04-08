import cheerio from 'cheerio';

import { buildFooter, buildStaticAddonCard } from 'blog-utils';
import { fakeAddon } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('buildFooter', () => {
    it('returns the footer HTML', () => {
      const html = cheerio.load(buildFooter());

      expect(html('.Footer')).toHaveLength(1);
      expect(html('.Footer-language-picker')).toHaveLength(0);
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

      expect(html('.StaticAddonCard')).toHaveLength(1);
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
});
