/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import { ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import translate from 'amo/i18n/translate';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';

type Props = {|
  addon: AddonType,
  hasCodeReviewPermission: boolean,
  hasContentReviewPermission: boolean,
  hasEditPermission: boolean,
  hasStaticThemeReviewPermission: boolean,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class AddonAdminLinksBase extends React.Component<InternalProps> {
  render(): React.Node {
    const {
      addon,
      hasCodeReviewPermission,
      hasContentReviewPermission,
      hasEditPermission,
      hasStaticThemeReviewPermission,
      i18n,
    } = this.props;

    const isTheme = addon.type === ADDON_TYPE_STATIC_THEME;

    const showCodeReviewLink = hasCodeReviewPermission && !isTheme;
    const showStaticThemeReviewLink = hasStaticThemeReviewPermission && isTheme;
    const showContentReviewLink = hasContentReviewPermission && !isTheme;

    const editLink = hasEditPermission ? (
      <li>
        <a
          className="AddonAdminLinks-edit-link"
          href={`/developers/addon/${addon.slug}/edit`}
        >
          {
            // eslint-disable-next-line max-len
            // L10n: This action allows the add-on developer or an admin to edit an add-on's properties.
            i18n.gettext('Edit add-on')
          }
        </a>
      </li>
    ) : null;

    const adminLink = hasEditPermission ? (
      <li>
        <a
          className="AddonAdminLinks-admin-link"
          href={`/admin/models/addons/addon/${addon.id}`}
        >
          {
            // L10n: This action allows an admin to maintain an add-on.
            i18n.gettext('Admin add-on')
          }
        </a>
      </li>
    ) : null;

    const contentReviewLink = showContentReviewLink ? (
      <li>
        <a
          className="AddonAdminLinks-contentReview-link"
          href={`/reviewers/review-content/${addon.id}`}
        >
          {
            // L10n: This action allows a reviewer to perform a content review of an add-on.
            i18n.gettext('Content review add-on')
          }
        </a>
      </li>
    ) : null;

    const codeReviewLinkText = isTheme
      ? // L10n: This action allows a reviewer to perform a review of a theme.
        i18n.gettext('Review theme')
      : // L10n: This action allows a reviewer to perform a review of an add-on's code.
        i18n.gettext('Review add-on code');
    const codeReviewLink =
      showCodeReviewLink || showStaticThemeReviewLink ? (
        <li>
          <a
            className={`AddonAdminLinks-${
              isTheme ? 'themeReview' : 'codeReview'
            }-link`}
            href={`/reviewers/review/${addon.id}`}
          >
            {codeReviewLinkText}
          </a>
        </li>
      ) : null;

    return (
      <ul className="AddonAdminLinks-list">
        {editLink}
        {adminLink}
        {contentReviewLink}
        {codeReviewLink}
      </ul>
    );
  }
}

const AddonAdminLinks: React.ComponentType<Props> = compose(translate())(
  AddonAdminLinksBase,
);

export default AddonAdminLinks;
