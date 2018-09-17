/* @flow */
import invariant from 'invariant';

import {
  DOWNLOAD_FAILED,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_FAILED,
} from 'core/constants';
import type { I18nType } from 'core/types/i18n';

export const getErrorMessage = ({
  i18n,
  error,
}: {|
  i18n: I18nType,
  error: string,
|}): string => {
  invariant(i18n, 'i18n is required');

  switch (error) {
    case INSTALL_FAILED:
      return i18n.gettext('Installation failed. Please try again.');
    case DOWNLOAD_FAILED:
      return i18n.gettext('Download failed. Please check your connection.');
    case FATAL_INSTALL_ERROR:
      return i18n.gettext('An unexpected error occurred during installation.');
    case FATAL_UNINSTALL_ERROR:
      return i18n.gettext(
        'An unexpected error occurred during uninstallation.',
      );
    case FATAL_ERROR:
    default:
      return i18n.gettext('An unexpected error occurred.');
  }
};
