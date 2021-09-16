import {
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  DOWNLOAD_FAILED,
  ERROR_CORRUPT_FILE,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_FAILED,
  OS_ALL,
  RECOMMENDED,
  SPONSORED,
  SPOTLIGHT,
  STRATEGIC,
  VERIFIED,
} from 'amo/constants';
import {
  createFakeAutocompleteResult,
  createInternalAddonWithLang,
  createInternalSuggestionWithLang,
  createInternalVersionWithLang,
  fakeAddon,
  fakeI18n,
  fakeVersion,
} from 'tests/unit/helpers';
import {
  getAddonJsonLinkedData,
  getErrorMessage,
  getFileHash,
  getPromotedCategory,
} from 'amo/utils/addons';

describe(__filename, () => {
  describe('getErrorMessage', () => {
    it.each([
      [INSTALL_FAILED, 'Installation failed'],
      [DOWNLOAD_FAILED, 'Download failed'],
      [
        ERROR_CORRUPT_FILE,
        'Installation aborted because the add-on appears to be corrupt.',
      ],
      [FATAL_INSTALL_ERROR, 'error occurred during installation'],
      [FATAL_UNINSTALL_ERROR, 'error occurred during uninstallation'],
      [FATAL_ERROR, 'unexpected error occurred.'],
      ['SOME OTHER ERROR', 'unexpected error occurred.'],
    ])('returns a readable message for %s', (error, message) => {
      expect(getErrorMessage({ i18n: fakeI18n(), error })).toMatch(
        new RegExp(message),
      );
    });
  });

  describe('getFileHash', () => {
    const _getFileHash = ({
      addon = createInternalAddonWithLang(fakeAddon),
      installURL = 'https://a.m.o/addons/file.xpi',
      version = createInternalVersionWithLang(fakeVersion),
    } = {}) => {
      return getFileHash({ addon, installURL, version });
    };

    it('finds a file hash if the URL matches', () => {
      const version = createInternalVersionWithLang({
        ...fakeVersion,
        file: {
          url: 'https://first-url',
          hash: 'hash-of-first-file',
        },
      });

      expect(
        _getFileHash({ installURL: 'https://first-url', version }),
      ).toEqual('hash-of-first-file');
    });

    it('strips query string parameters from the URL', () => {
      const url = 'https://a.m.o/addons/file.xpi';
      const version = createInternalVersionWithLang({
        ...fakeVersion,
        file: { platform: OS_ALL, url, hash: 'hash-of-file' },
      });

      expect(
        _getFileHash({
          installURL: `${url}?src=some-install-source`,
          version,
        }),
      ).toEqual('hash-of-file');
    });

    it('handles addon file URLs with unrelated query strings', () => {
      const url = 'https://a.m.o/addons/file.xpi';
      const version = createInternalVersionWithLang({
        ...fakeVersion,
        file: {
          platform: OS_ALL,
          url: `${url}?src=some-install-source`,
          hash: 'hash-of-file',
        },
      });

      expect(
        _getFileHash({
          installURL: `${url}?src=some-install-source`,
          version,
        }),
      ).toEqual('hash-of-file');
    });
  });

  describe('getAddonJsonLinkedData', () => {
    it('returns structured data', () => {
      const addon = createInternalAddonWithLang(fakeAddon);
      const currentVersion = createInternalVersionWithLang(fakeVersion);

      expect(getAddonJsonLinkedData({ addon, currentVersion })).toEqual({
        '@context': 'http://schema.org',
        '@type': 'WebApplication',
        name: addon.name,
        url: addon.url,
        image: addon.previews[0].src,
        applicationCategory: 'http://schema.org/OtherApplication',
        operatingSystem: 'Firefox',
        description: addon.summary,
        offers: {
          '@type': 'Offer',
          availability: 'http://schema.org/InStock',
          price: 0,
          priceCurrency: 'USD',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingCount: addon.ratings.count,
          ratingValue: addon.ratings.average,
        },
        version: currentVersion.version,
      });
    });

    it('returns structured data without the version if not available', () => {
      const addon = createInternalAddonWithLang(fakeAddon);

      expect(
        getAddonJsonLinkedData({ addon, currentVersion: null }),
      ).not.toHaveProperty('version');
    });

    it('returns structured data without rating if not available', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        ratings: null,
      });

      expect(getAddonJsonLinkedData({ addon })).not.toHaveProperty(
        'aggregateRating',
      );
    });

    it('returns structured data without rating if count is 0', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        ratings: {
          ...fakeAddon.ratings,
          count: 0,
        },
      });

      expect(getAddonJsonLinkedData({ addon })).not.toHaveProperty(
        'aggregateRating',
      );
    });

    it('returns structured data without rating if average is below threshold', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        ratings: {
          ...fakeAddon.ratings,
          average: 3.2,
        },
      });

      expect(
        getAddonJsonLinkedData({ addon, ratingThreshold: 4 }),
      ).not.toHaveProperty('aggregateRating');
    });
  });

  describe('getPromotedCategory', () => {
    it('returns null if the addon is not promoted', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        promoted: null,
      });
      const suggestion = createInternalSuggestionWithLang(
        createFakeAutocompleteResult({ promoted: null }),
      );

      expect(
        getPromotedCategory({ addon, clientApp: CLIENT_APP_ANDROID }),
      ).toEqual(null);
      expect(
        getPromotedCategory({
          addon: suggestion,
          clientApp: CLIENT_APP_ANDROID,
        }),
      ).toEqual(null);
    });

    it('returns null if the addon is not promoted for the specified app', () => {
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        promoted: { category: RECOMMENDED, apps: [CLIENT_APP_ANDROID] },
      });
      const suggestion = createInternalSuggestionWithLang(
        createFakeAutocompleteResult({
          promoted: { category: RECOMMENDED, apps: [CLIENT_APP_ANDROID] },
        }),
      );

      expect(
        getPromotedCategory({ addon, clientApp: CLIENT_APP_FIREFOX }),
      ).toEqual(null);
      expect(
        getPromotedCategory({
          addon: suggestion,
          clientApp: CLIENT_APP_FIREFOX,
        }),
      ).toEqual(null);
    });

    it('returns the category if the addon is promoted for the specified app', () => {
      const category = RECOMMENDED;
      const addon = createInternalAddonWithLang({
        ...fakeAddon,
        promoted: { category, apps: [CLIENT_APP_ANDROID] },
      });
      const suggestion = createInternalSuggestionWithLang(
        createFakeAutocompleteResult({
          promoted: { category, apps: [CLIENT_APP_ANDROID] },
        }),
      );

      expect(
        getPromotedCategory({ addon, clientApp: CLIENT_APP_ANDROID }),
      ).toEqual(category);
      expect(
        getPromotedCategory({
          addon: suggestion,
          clientApp: CLIENT_APP_ANDROID,
        }),
      ).toEqual(category);
    });

    describe('forBadging === true', () => {
      it.each([SPOTLIGHT, STRATEGIC])(
        'returns null if the category is not one for badges, category: %s',
        (category) => {
          const addon = createInternalAddonWithLang({
            ...fakeAddon,
            promoted: { category, apps: [CLIENT_APP_ANDROID] },
          });

          expect(
            getPromotedCategory({
              addon,
              clientApp: CLIENT_APP_ANDROID,
              forBadging: true,
            }),
          ).toEqual(null);
        },
      );

      it('returns VERIFIED if the category is SPONSORED', () => {
        const addon = createInternalAddonWithLang({
          ...fakeAddon,
          promoted: { category: SPONSORED, apps: [CLIENT_APP_ANDROID] },
        });

        expect(
          getPromotedCategory({
            addon,
            clientApp: CLIENT_APP_ANDROID,
            forBadging: true,
          }),
        ).toEqual(VERIFIED);
      });
    });
  });
});
