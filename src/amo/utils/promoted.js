/* @flow */

import { LINE, RECOMMENDED, PROMOTED_ADDONS_SUMO_URL } from 'amo/constants';
import type { I18nType } from 'amo/types/i18n';

import { makeQueryStringWithUTM } from './index';

export type PromotedBadgeCategory = typeof LINE | typeof RECOMMENDED;

export const getPromotedBadgesLinkUrl = ({
  utm_content,
}: {|
  utm_content: string,
|}): string => {
  return `${PROMOTED_ADDONS_SUMO_URL}${makeQueryStringWithUTM({
    utm_campaign: null,
    utm_content,
  })}`;
};

export function getPromotedProps(
  i18n: I18nType,
  category: PromotedBadgeCategory,
): {
  label: string,
  linkUrl: string,
  linkTitle: string,
  alt: string,
  category: PromotedBadgeCategory,
} {
  const linkUrl = getPromotedBadgesLinkUrl({
    utm_content: 'promoted-addon-badge',
  });
  switch (category) {
    case LINE:
      return {
        category,
        linkUrl,
        label: i18n.gettext('By Firefox'),
        linkTitle: i18n.gettext(
          'Official add-on built by Mozilla Firefox. Meets security and performance standards.',
        ),
        alt: i18n.gettext('By Firefox'),
      };
    case RECOMMENDED:
      return {
        category,
        linkUrl,
        label: i18n.gettext('Recommended'),
        linkTitle: i18n.gettext(
          'Firefox only recommends add-ons that meet our standards for security and performance.',
        ),
        alt: i18n.gettext('Recommended'),
      };
    default:
      throw new Error(`Invalid promoted badge category: ${category}`);
  }
}
