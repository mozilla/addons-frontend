/* @flow */
import { oneLine } from 'common-tags';
import invariant from 'invariant';

import {
  DOWNLOAD_FAILED,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_FAILED,
} from 'core/constants';
import log from 'core/logger';
import { getPreviewImage } from 'core/imageUtils';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

export const getErrorMessage = ({
  i18n,
  error,
}: {|
  i18n: I18nType,
  error: string | void,
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

export const getFileHash = ({
  addon,
  installURL,
}: {|
  addon: AddonType,
  installURL: string,
|}): string | void => {
  const urlKey = installURL.split('?')[0];

  if (addon.current_version) {
    for (const file of addon.current_version.files) {
      // The API sometimes appends ?src= to URLs so we just check the basename.
      if (file.url.startsWith(urlKey)) {
        return file.hash;
      }
    }
  }

  log.warn(oneLine`No file hash found for addon "${addon.slug}", installURL
    "${installURL}" (as "${urlKey}")`);

  return undefined;
};

export function removeUndefinedProps(object: Object): Object {
  const newObject = {};
  Object.keys(object).forEach((key) => {
    if (typeof object[key] !== 'undefined') {
      newObject[key] = object[key];
    }
  });
  return newObject;
}

export const getAddonJsonLinkedData = ({
  addon,
  ratingThreshold = 3.3,
}: {|
  addon: AddonType,
  ratingThreshold?: number,
|}): Object => {
  const { current_version: currentVersion, ratings } = addon;

  let aggregateRating;
  if (ratings && ratings.count > 0 && ratings.average >= ratingThreshold) {
    aggregateRating = {
      '@type': 'AggregateRating',
      ratingCount: ratings.count,
      ratingValue: ratings.average,
    };
  }

  return removeUndefinedProps({
    '@context': 'http://schema.org',
    '@type': 'WebApplication',
    name: addon.name,
    url: addon.url,
    image: getPreviewImage(addon),
    applicationCategory: 'http://schema.org/OtherApplication',
    operatingSystem: 'Firefox',
    description: addon.summary,
    offers: {
      '@type': 'Offer',
      availability: 'http://schema.org/InStock',
      price: 0,
      priceCurrency: 'USD',
    },
    version: currentVersion ? currentVersion.version : undefined,
    aggregateRating,
  });
};
