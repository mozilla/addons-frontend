/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import { Definition } from 'amo/components/DefinitionList';
import {
  ADDONS_CONTENT_REVIEW,
  ADDONS_EDIT,
  ADDONS_REVIEW,
  ADDON_TYPE_STATIC_THEME,
  REVIEWER_TOOLS_VIEW,
  STATIC_THEMES_REVIEW,
} from 'amo/constants';
import translate from 'amo/i18n/translate';
import { hasPermission } from 'amo/reducers/users';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';
import type { AppState } from 'amo/store';

type Props = {|
  addon: AddonType | null,
|};

type PropsFromState = {|
  hasCodeReviewPermission: boolean,
  hasContentReviewPermission: boolean,
  hasEditPermission: boolean,
  hasStaticThemeReviewPermission: boolean,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  i18n: I18nType,
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
      <Definition
        className="AddonAdminLinks"
        term={
          // L10n: This is a list of links to administrative functions.
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
    );
  }
}

const mapStateToProps = (state: AppState): PropsFromState => {
  return {
    hasCodeReviewPermission:
      hasPermission(state, ADDONS_REVIEW) ||
      hasPermission(state, REVIEWER_TOOLS_VIEW),
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
