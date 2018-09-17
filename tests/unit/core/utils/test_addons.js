import {
  DOWNLOAD_FAILED,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_FAILED,
} from 'core/constants';
import { getErrorMessage } from 'core/utils/addons';
import { fakeI18n } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getErrorMessage', () => {
    it.each([
      [INSTALL_FAILED, 'Installation failed'],
      [DOWNLOAD_FAILED, 'Download failed'],
      [FATAL_INSTALL_ERROR, 'error occurred during installation'],
      [FATAL_UNINSTALL_ERROR, 'error occurred during uninstallation'],
      [FATAL_ERROR, 'unexpected error occurred.'],
      ['SOME OTHER ERROR', 'unexpected error occurred.'],
    ])('returns a translated message for %s', (error, message) => {
      expect(getErrorMessage({ i18n: fakeI18n(), error })).toMatch(
        new RegExp(message),
      );
    });
  });
});
