/* @flow */
import { oneLine } from 'common-tags';
import invariant from 'invariant';

import {
  BADGE_CATEGORIES,
  DOWNLOAD_FAILED,
  ERROR_CORRUPT_FILE,
  FATAL_ERROR,
  FATAL_INSTALL_ERROR,
  FATAL_UNINSTALL_ERROR,
  INSTALL_FAILED,
  ALL_PROMOTED_CATEGORIES,
} from 'amo/constants';
import log from 'amo/logger';
import { getPreviewImage } from 'amo/imageUtils';
import { removeUndefinedProps } from 'amo/utils/url';
import type { PromotedCategoryType } from 'amo/constants';
import type { SuggestionType } from 'amo/reducers/autocomplete';
import type { AddonVersionType } from 'amo/reducers/versions';
import type { AddonType, CollectionAddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';

export const getErrorMessage = ({
  i18n,
  error,
}: {|
  i18n: I18nType,
  error: string | void,
|}): string => {
  invariant(i18n, 'i18n is required');

  switch (error) {
    case ERROR_CORRUPT_FILE:
      return i18n.gettext(
        'Installation aborted because the add-on appears to be corrupt.',
      );
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
  version,
}: {|
  addon: AddonType,
  installURL: string,
  version: AddonVersionType,
|}): string | void => {
  const urlKey = installURL.split('?')[0];
  const { file } = version;
  // The API sometimes appends ?src= to URLs so we just check the basename.
  if (file && file.url.startsWith(urlKey)) {
    return file.hash;
  }

  log.warn(oneLine`No file hash found for addon "${addon.slug}", installURL
    "${installURL}" (as "${urlKey}")`);

  return undefined;
};

export const getAddonJsonLinkedData = ({
  addon,
  currentVersion,
  ratingThreshold = 3.3,
}: {|
  addon: AddonType,
  currentVersion: AddonVersionType | null,
  ratingThreshold?: number,
|}): Object => {
  const { ratings } = addon;

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

export const getPromotedCategories = ({
  addon,
  clientApp,
  forBadging = false,
}: {|
  addon: AddonType | CollectionAddonType | SuggestionType | null | void,
  clientApp: string,
  forBadging?: boolean,
|}): Array<PromotedCategoryType> => {
  if (!addon?.promoted) return [];

  const categories: Array<PromotedCategoryType> = addon.promoted
    .filter((promoted) => {
      if (!promoted.apps.includes(clientApp)) {
        return false;
      }
      // Special logic if we're using the category for badging.
      // We shouldn't add badges that are in BADGE_CATEGORIES.
      return forBadging ? BADGE_CATEGORIES.includes(promoted.category) : true;
    })
    .map((promoted) => promoted.category)
    .sort(
      (a, b) =>
        ALL_PROMOTED_CATEGORIES.indexOf(a) - ALL_PROMOTED_CATEGORIES.indexOf(b),
    );

  // Return only the 'most important' badge.
  return categories.length > 0 ? [categories[0]] : [];
};
