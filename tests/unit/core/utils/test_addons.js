import {
  DOWNLOAD_FAILED,
  ERROR_CORRUPT_FILE,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_FAILED,
  OS_ALL,
  OS_MAC,
  OS_WINDOWS,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { createInternalVersion } from 'core/reducers/versions';
import { fakeAddon, fakeI18n, fakeVersion } from 'tests/unit/helpers';
import {
  getAddonJsonLinkedData,
  getErrorMessage,
  getFileHash,
  removeUndefinedProps,
} from 'core/utils/addons';

describe(__filename, () => {
  describe('getErrorMessage', () => {
    it.each([
      [INSTALL_FAILED, 'Installation failed'],
      [DOWNLOAD_FAILED, 'Download failed'],
      [ERROR_CORRUPT_FILE, 'Installation aborted because the add-on is unverified.'],
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
      addon = createInternalAddon(fakeAddon),
      installURL = 'https://a.m.o/addons/file.xpi',
      version = createInternalVersion(fakeVersion),
    } = {}) => {
      return getFileHash({ addon, installURL, version });
    };

    it('finds a file hash matching the URL', () => {
      const version = createInternalVersion({
        ...fakeVersion,
        files: [
          {
            platform: OS_MAC,
            url: 'https://first-url',
            hash: 'hash-of-first-file',
          },
          {
            platform: OS_WINDOWS,
            url: 'https://second-url',
            hash: 'hash-of-second-file',
          },
        ],
      });

      expect(
        _getFileHash({ installURL: 'https://second-url', version }),
      ).toEqual('hash-of-second-file');
    });

    it('strips query string parameters from the URL', () => {
      const url = 'https://a.m.o/addons/file.xpi';
      const version = createInternalVersion({
        ...fakeVersion,
        files: [{ platform: OS_ALL, url, hash: 'hash-of-file' }],
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
      const version = createInternalVersion({
        ...fakeVersion,
        files: [
          {
            platform: OS_ALL,
            url: `${url}?src=some-install-source`,
            hash: 'hash-of-file',
          },
        ],
      });

      expect(
        _getFileHash({
          installURL: `${url}?src=some-install-source`,
          version,
        }),
      ).toEqual('hash-of-file');
    });

    it('does not find a file hash without files', () => {
      const version = createInternalVersion({
        ...fakeVersion,
        files: [],
      });

      expect(_getFileHash({ version })).toBeUndefined();
    });
  });

  describe('getAddonJsonLinkedData', () => {
    it('returns structured data', () => {
      const addon = createInternalAddon(fakeAddon);
      const currentVersion = createInternalVersion(fakeVersion);

      expect(getAddonJsonLinkedData({ addon, currentVersion })).toEqual({
        '@context': 'http://schema.org',
        '@type': 'WebApplication',
        name: addon.name,
        url: addon.url,
        image: addon.previews[0].image_url,
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
      const addon = createInternalAddon(fakeAddon);

      expect(
        getAddonJsonLinkedData({ addon, currentVersion: null }),
      ).not.toHaveProperty('version');
    });

    it('returns structured data without rating if not available', () => {
      const addon = createInternalAddon({
        ...fakeAddon,
        ratings: null,
      });

      expect(getAddonJsonLinkedData({ addon })).not.toHaveProperty(
        'aggregateRating',
      );
    });

    it('returns structured data without rating if count is 0', () => {
      const addon = createInternalAddon({
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
      const addon = createInternalAddon({
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

  describe('removeUndefinedProps', () => {
    it('removes undefined properties', () => {
      expect(removeUndefinedProps({ thing: undefined })).toEqual({});
    });

    it('preserves falsy properties', () => {
      expect(removeUndefinedProps({ thing: false })).toEqual({ thing: false });
    });

    it('preserves other properties', () => {
      expect(removeUndefinedProps({ thing: 'thing' })).toEqual({
        thing: 'thing',
      });
    });

    it('does not modify the original object', () => {
      const example = { thing: undefined };
      removeUndefinedProps(example);
      expect(example).toEqual({ thing: undefined });
    });
  });
});
