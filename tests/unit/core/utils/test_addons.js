import {
  DOWNLOAD_FAILED,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_FAILED,
  OS_ALL,
  OS_MAC,
  OS_WINDOWS,
} from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { getErrorMessage, getFileHash } from 'core/utils/addons';
import { fakeI18n } from 'tests/unit/helpers';
import { createFakeAddon, fakeAddon } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  describe('getErrorMessage', () => {
    it.each([
      [INSTALL_FAILED, 'Installation failed'],
      [DOWNLOAD_FAILED, 'Download failed'],
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
    } = {}) => {
      return getFileHash({ addon, installURL });
    };

    it('finds a file hash matching the URL', () => {
      const addon = createInternalAddon(
        createFakeAddon({
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
        }),
      );

      expect(_getFileHash({ addon, installURL: 'https://second-url' })).toEqual(
        'hash-of-second-file',
      );
    });

    it('strips query string parameters from the URL', () => {
      const url = 'https://a.m.o/addons/file.xpi';
      const addon = createInternalAddon(
        createFakeAddon({
          files: [{ platform: OS_ALL, url, hash: 'hash-of-file' }],
        }),
      );

      expect(
        _getFileHash({
          addon,
          installURL: `${url}?src=some-install-source`,
        }),
      ).toEqual('hash-of-file');
    });

    it('handles addon file URLs with unrelated query strings', () => {
      const url = 'https://a.m.o/addons/file.xpi';
      const addon = createInternalAddon(
        createFakeAddon({
          files: [
            {
              platform: OS_ALL,
              url: `${url}?src=some-install-source`,
              hash: 'hash-of-file',
            },
          ],
        }),
      );

      expect(
        _getFileHash({
          addon,
          installURL: `${url}?src=some-install-source`,
        }),
      ).toEqual('hash-of-file');
    });

    it('does not find a file hash without a current version', () => {
      const addon = createInternalAddon(
        createFakeAddon({
          current_version: undefined,
        }),
      );

      expect(_getFileHash({ addon })).toBeUndefined();
    });

    it('does not find a file hash without files', () => {
      const addon = createInternalAddon({
        ...fakeAddon,
        current_version: {
          ...fakeAddon.current_version,
          files: [],
        },
      });

      expect(_getFileHash({ addon })).toBeUndefined();
    });
  });
});
