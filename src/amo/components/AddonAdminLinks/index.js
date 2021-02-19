/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import {
  ADDONS_CONTENT_REVIEW,
  ADDONS_EDIT,
  ADDONS_REVIEW,
  ADDON_TYPE_STATIC_THEME,
  STATIC_THEMES_REVIEW,
} from 'amo/constants';
import translate from 'amo/i18n/translate';
import { hasPermission } from 'amo/reducers/users';
import type { AddonType } from 'amo/types/addons';
import DefinitionList, { Definition } from 'amo/components/DefinitionList';
import type { I18nType } from 'amo/types/i18n';
import type { AppState } from 'amo/store';

type Props = {|
  addon: AddonType | null,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  hasCodeReviewPermission: boolean,
  hasContentReviewPermission: boolean,
  hasEditPermission: boolean,
  hasStaticThemeReviewPermission: boolean,
|};

export class AddonAdminLinksBase extends React.Component<InternalProps> {
  render(): null | React.Node {
    const {
      addon,
      hasCodeReviewPermission,
      hasContentReviewPermission,
      hasEditPermission,
      hasStaticThemeReviewPermission,
      i18n,
    } = this.props;

    if (addon === null) {
      return null;
    }

    const isTheme = addon.type === ADDON_TYPE_STATIC_THEME;

    const showCodeReviewLink = hasCodeReviewPermission && !isTheme;
    const showStaticThemeReviewLink = hasStaticThemeReviewPermission && isTheme;
    const showContentReviewLink = hasContentReviewPermission && !isTheme;
    const hasALink =
      hasEditPermission ||
      showContentReviewLink ||
      showCodeReviewLink ||
      showStaticThemeReviewLink;

    if (!hasALink) {
      return null;
    }

    const editLink = hasEditPermission ? (
      <li>
        <a
          className="AddonAdminLinks-edit-link"
          href={`/developers/addon/${addon.slug}/edit`}
        >
          {
            // eslint-disable-next-line max-len
            // translators: This action allows the add-on developer or an admin to edit an add-on's properties.
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
            // translators: This action allows an admin to maintain an add-on.
            i18n.gettext('Admin add-on')
          }
        </a>
      </li>
    ) : null;

    const contentReviewLink = showContentReviewLink ? (
      <li>
        <a
          className="AddonAdminLinks-contentReview-link"
          href={`/reviewers/review-content/${addon.slug}`}
        >
          {
            // translators: This action allows a reviewer to perform a content review of an add-on.
            i18n.gettext('Content review add-on')
          }
        </a>
      </li>
    ) : null;

    const codeReviewLinkText = isTheme
      ? // translators: This action allows a reviewer to perform a review of a theme.
        i18n.gettext('Review theme')
      : // translators: This action allows a reviewer to perform a review of an add-on's code.
        i18n.gettext('Review add-on code');
    const codeReviewLink =
      showCodeReviewLink || showStaticThemeReviewLink ? (
        <li>
          <a
            className={`AddonAdminLinks-${
              isTheme ? 'themeReview' : 'codeReview'
            }-link`}
            href={`/reviewers/review/${addon.slug}`}
          >
            {codeReviewLinkText}
          </a>
        </li>
      ) : null;

    return (
      <DefinitionList className="AddonAdminLinks">
        <Definition
          term={
            // translators: This is a list of links to administrative functions.
            i18n.gettext('Admin Links')
          }
        >
          <ul className="AddonAdminLinks-list">
            {editLink}
            {adminLink}
            {contentReviewLink}
            {codeReviewLink}
          </ul>
        </Definition>
      </DefinitionList>
    );
  }
}

export const mapStateToProps = (
  state: AppState,
): {|
  hasCodeReviewPermission: boolean,
  hasContentReviewPermission: boolean,
  hasEditPermission: boolean,
  hasStaticThemeReviewPermission: boolean,
|} => {
  return {
    hasCodeReviewPermission: hasPermission(state, ADDONS_REVIEW),
    hasContentReviewPermission: hasPermission(state, ADDONS_CONTENT_REVIEW),
    hasEditPermission: hasPermission(state, ADDONS_EDIT),
    hasStaticThemeReviewPermission: hasPermission(state, STATIC_THEMES_REVIEW),
  };
};

const AddonAdminLinks: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(AddonAdminLinksBase);

export default AddonAdminLinks;
