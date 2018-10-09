/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import {
  ADDONS_CONTENTREVIEW,
  ADDONS_EDIT,
  ADDONS_POSTREVIEW,
  ADMIN_TOOLS_VIEW,
  THEMES_REVIEW,
} from 'core/constants';
import translate from 'core/i18n/translate';
import { hasPermission } from 'amo/reducers/users';
import type { AddonType } from 'core/types/addons';
import { isTheme } from 'core/utils';
import DefinitionList, { Definition } from 'ui/components/DefinitionList';
import type { I18nType } from 'core/types/i18n';
import type { AppState } from 'amo/store';

type Props = {|
  addon: AddonType | null,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
  hasAdminPermission: boolean,
  hasCodeReviewPermission: boolean,
  hasContentReviewPermission: boolean,
  hasEditPermission: boolean,
  hasThemeReviewPermission: boolean,
|};

export class AddonAdminLinksBase extends React.Component<InternalProps> {
  render() {
    const {
      addon,
      hasAdminPermission,
      hasCodeReviewPermission,
      hasContentReviewPermission,
      hasEditPermission,
      hasThemeReviewPermission,
      i18n,
    } = this.props;

    if (addon === null) {
      return null;
    }

    const showCodeReviewLink = hasCodeReviewPermission && !isTheme(addon.type);
    const showThemeReviewLink = hasThemeReviewPermission && isTheme(addon.type);
    const showContentReviewLink =
      hasContentReviewPermission && !isTheme(addon.type);
    const hasALink =
      hasEditPermission ||
      hasAdminPermission ||
      showContentReviewLink ||
      showCodeReviewLink ||
      showThemeReviewLink;

    if (!hasALink) {
      return null;
    }

    const editLink = hasEditPermission ? (
      <li>
        <a
          className="AddonAdminLinks-edit-link"
          href={`/developers/addon/${addon.slug}/edit`}
        >
          {i18n.gettext('Edit add-on')}
        </a>
      </li>
    ) : null;

    const adminStatusLink = hasAdminPermission ? (
      <li>
        <a
          className="AddonAdminLinks-admin-status-link"
          href={`/admin/addon/manage/${addon.slug}/`}
        >
          {i18n.gettext('Admin add-on status')}
        </a>
      </li>
    ) : null;

    const adminLink =
      hasAdminPermission && hasEditPermission ? (
        <li>
          <a
            className="AddonAdminLinks-admin-link"
            href={`/admin/models/addons/addon/${addon.id}`}
          >
            {i18n.gettext('Admin add-on')}
          </a>
        </li>
      ) : null;

    const contentReviewLink = showContentReviewLink ? (
      <li>
        <a
          className="AddonAdminLinks-contentReview-link"
          href={`/reviewers/review-content/${addon.slug}`}
        >
          {i18n.gettext('Content review add-on')}
        </a>
      </li>
    ) : null;

    const codeReviewLinkText = isTheme(addon.type)
      ? i18n.gettext('Review theme')
      : i18n.gettext('Review add-on code');
    const codeReviewLink =
      showCodeReviewLink || showThemeReviewLink ? (
        <li>
          <a
            className={`AddonAdminLinks-${
              isTheme(addon.type) ? 'themeReview' : 'codeReview'
            }-link`}
            href={`/reviewers/review/${addon.slug}`}
          >
            {codeReviewLinkText}
          </a>
        </li>
      ) : null;

    return (
      <DefinitionList className="AddonAdminLinks">
        <Definition term={i18n.gettext('Admin Links')}>
          <ul className="AddonAdminLinks-list">
            {editLink}
            {adminStatusLink}
            {adminLink}
            {contentReviewLink}
            {codeReviewLink}
          </ul>
        </Definition>
      </DefinitionList>
    );
  }
}

export const mapStateToProps = (state: AppState) => {
  return {
    hasAdminPermission: hasPermission(state, ADMIN_TOOLS_VIEW),
    hasCodeReviewPermission: hasPermission(state, ADDONS_POSTREVIEW),
    hasContentReviewPermission: hasPermission(state, ADDONS_CONTENTREVIEW),
    hasEditPermission: hasPermission(state, ADDONS_EDIT),
    hasThemeReviewPermission: hasPermission(state, THEMES_REVIEW),
  };
};

const AddonAdminLinks: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(AddonAdminLinksBase);

export default AddonAdminLinks;
