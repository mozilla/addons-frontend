/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
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

    if (!addon) {
      return null;
    }

    const showCodeReviewLink = hasCodeReviewPermission && !isTheme(addon.type);
    const showThemeReviewLink = hasThemeReviewPermission && isTheme(addon.type);
    const hasALink =
      hasEditPermission ||
      hasAdminPermission ||
      hasContentReviewPermission ||
      showCodeReviewLink ||
      showThemeReviewLink;

    if (!hasALink) {
      return null;
    }

    const editLink = hasEditPermission ? (
      <li>
        <Link
          className="AddonAdminLinks-edit-link"
          href={`/developers/addon/${addon.slug}/edit`}
        >
          {i18n.gettext('Edit add-on')}
        </Link>
      </li>
    ) : null;

    const adminLink = hasAdminPermission ? (
      <li>
        <Link
          className="AddonAdminLinks-admin-link"
          href={`/admin/addon/manage/${addon.slug}/`}
        >
          {i18n.gettext('Admin add-on')}
        </Link>
      </li>
    ) : null;

    const contentReviewLink = hasContentReviewPermission ? (
      <li>
        <Link
          className="AddonAdminLinks-contentReview-link"
          href={`/reviewers/review-content/${addon.slug}`}
        >
          {i18n.gettext('Content review add-on')}
        </Link>
      </li>
    ) : null;

    const codeReviewLink = showCodeReviewLink ? (
      <li>
        <Link
          className="AddonAdminLinks-codeReview-link"
          href={`/reviewers/review/${addon.slug}`}
        >
          {i18n.gettext('Code review add-on')}
        </Link>
      </li>
    ) : null;

    const themeReviewLink = showThemeReviewLink ? (
      <li>
        <Link
          className="AddonAdminLinks-themeReview-link"
          href={`/reviewers/review/${addon.slug}`}
        >
          {i18n.gettext('Review theme')}
        </Link>
      </li>
    ) : null;

    return (
      <DefinitionList className="AddonAdminLinks">
        <Definition term={i18n.gettext('Admin Links')}>
          <ul className="AddonAdminLinks-list">
            {editLink}
            {adminLink}
            {contentReviewLink}
            {codeReviewLink}
            {themeReviewLink}
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
