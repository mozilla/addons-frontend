/* @flow */
import type { I18nType } from 'amo/types/i18n';

export const getNotificationDescription = (
  i18n: I18nType,
  name: string,
): string | null => {
  switch (name) {
    case 'announcements':
      return i18n.gettext(
        'stay up-to-date with news and events relevant to add-on developers (including the about:addons newsletter)',
      );
    case 'individual_contact':
      return i18n.gettext(
        'Mozilla needs to contact me about my individual add-on',
      );
    case 'new_features':
      return i18n.gettext('new add-ons or Firefox features are available');
    case 'new_review':
      return i18n.gettext('someone writes a review of my add-on');
    case 'reply':
      return i18n.gettext('an add-on developer replies to my review');
    case 'reviewer_reviewed':
      return i18n.gettext('my add-on is reviewed by a reviewer');
    case 'upgrade_fail':
      return i18n.gettext("my add-on's compatibility cannot be upgraded");
    case 'upgrade_success':
      return i18n.gettext("my add-on's compatibility is upgraded successfully");
    default:
      return null;
  }
};
