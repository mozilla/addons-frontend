/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddAddonToCollection from 'amo/components/AddAddonToCollection';
import Link from 'amo/components/Link';
import { STATS_VIEW } from 'core/constants';
import translate from 'core/i18n/translate';
import { hasPermission } from 'amo/reducers/users';
import type { AddonType } from 'core/types/addons';
import {
  addonHasVersionHistory,
  isAddonAuthor,
  trimAndAddProtocolToUrl,
} from 'core/utils';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';
import type { I18nType } from 'core/types/i18n';
import type { UsersStateType } from 'amo/reducers/users';

import './styles.scss';


type Props = {|
  addon: AddonType | null,
  i18n: I18nType,
  userId: number | null,
  hasStatsPermission: boolean,
|};

const renderNodesIf = (includeContent: boolean, nodes: Array<any>) => {
  return includeContent ? nodes : null;
};

export class AddonMoreInfoBase extends React.Component<Props> {
  listContent() {
    const { addon, i18n, userId, hasStatsPermission } = this.props;

    if (!addon) {
      return this.renderDefinitions({
        versionLastUpdated: <LoadingText minWidth={20} />,
        versionLicense: <LoadingText minWidth={20} />,
      });
    }

    let homepage = trimAndAddProtocolToUrl(addon.homepage);
    if (homepage) {
      homepage = (
        <li>
          <a className="AddonMoreInfo-homepage-link" href={homepage}>
            {i18n.gettext('Homepage')}
          </a>
        </li>
      );
    }

    let supportUrl = trimAndAddProtocolToUrl(addon.support_url);
    if (supportUrl) {
      supportUrl = (
        <li>
          <a className="AddonMoreInfo-support-link" href={supportUrl}>
            {i18n.gettext('Support Site')}
          </a>
        </li>
      );
    }

    let supportEmail = addon.support_email;
    if (supportEmail && /.+@.+/.test(supportEmail)) {
      supportEmail = (
        <li>
          <a
            className="AddonMoreInfo-support-email"
            href={`mailto:${supportEmail}`}
          >
            {i18n.gettext('Support Email')}
          </a>
        </li>
      );
    } else {
      supportEmail = null;
    }

    let statsLink = null;
    if (isAddonAuthor({ addon, userId }) || addon.public_stats || hasStatsPermission) {
      statsLink = (
        <Link
          className="AddonMoreInfo-stats-link"
          href={`/addon/${addon.slug}/statistics/`}
        >
          {i18n.gettext('Visit stats dashboard')}
        </Link>
      );
    }

    const currentVersion = addon.current_version;

    return this.renderDefinitions({
      homepage,
      supportUrl,
      supportEmail,
      statsLink,
      version: currentVersion && addonHasVersionHistory(addon) ?
        currentVersion.version : null,
      versionLastUpdated: i18n.sprintf(
        // translators: This will output, in English:
        // "2 months ago (Dec 12 2016)"
        i18n.gettext('%(timeFromNow)s (%(date)s)'), {
          timeFromNow: i18n.moment(addon.last_updated).fromNow(),
          date: i18n.moment(addon.last_updated).format('ll'),
        }
      ),
      versionLicenseLink: currentVersion && currentVersion.license ? (
        <Link
          className="AddonMoreInfo-license-link"
          href={currentVersion.license.url}
          prependClientApp={false}
          prependLang={false}
        >
          {currentVersion.license.name}
        </Link>
      ) : null,
      privacyPolicyLink: addon.has_privacy_policy ? (
        <Link
          className="AddonMoreInfo-privacy-policy-link"
          href={`/addon/${addon.slug}/privacy/`}
        >
          {i18n.gettext('Read the privacy policy for this add-on')}
        </Link>
      ) : null,
      eulaLink: addon.has_eula ? (
        <Link
          className="AddonMoreInfo-eula-link"
          href={`/addon/${addon.slug}/eula/`}
        >
          {i18n.gettext('Read the license agreement for this add-on')}
        </Link>
      ) : null,
      versionHistoryLink: addonHasVersionHistory(addon) ? (
        <li>
          <Link
            className="AddonMoreInfo-version-history-link"
            href={`/addon/${addon.slug}/versions/`}
          >
            {i18n.gettext('See all versions')}
          </Link>
        </li>
      ) : null,
      // Since current_beta_version is just an alias to the latest beta,
      // we can assume that no betas exist at all if it is null.
      betaVersionsLink: addon.current_beta_version ? (
        <li>
          <Link
            className="AddonMoreInfo-beta-versions-link"
            href={`/addon/${addon.slug}/versions/beta`}
          >
            {i18n.gettext('See all beta versions')}
          </Link>
        </li>
      ) : null,
    });
  }

  renderDefinitions({
    homepage = null,
    supportUrl = null,
    supportEmail = null,
    statsLink = null,
    privacyPolicyLink = null,
    eulaLink = null,
    version = null,
    versionLastUpdated,
    versionLicenseLink = null,
    versionHistoryLink = null,
    betaVersionsLink = null,
  }: Object) {
    const { i18n } = this.props;
    return (
      <dl className="AddonMoreInfo-contents">
        {renderNodesIf(homepage || supportUrl || supportEmail, [
          <dt className="AddonMoreInfo-links-title" key="links-title">
            {i18n.gettext('Add-on Links')}
          </dt>,
          <dd className="AddonMoreInfo-links-contents" key="links-contents">
            <ul className="AddonMoreInfo-links-contents-list">
              {homepage}
              {supportUrl}
              {supportEmail}
            </ul>
          </dd>,
        ])}

        {renderNodesIf(version, [
          <dt className="AddonMoreInfo-version-title" key="version-title">
            {i18n.gettext('Version')}
          </dt>,
          <dd className="AddonMoreInfo-version" key="version-contents">
            {version}
          </dd>,
        ])}

        <dt className="AddonMoreInfo-last-updated-title">
          {i18n.gettext('Last updated')}
        </dt>
        <dd>{versionLastUpdated}</dd>

        {renderNodesIf(versionLicenseLink, [
          <dt className="AddonMoreInfo-license-title" key="license-title">
            {i18n.gettext('License')}
          </dt>,
          <dd key="license-contents">{versionLicenseLink}</dd>,
        ])}

        {renderNodesIf(privacyPolicyLink, [
          <dt className="AddonMoreInfo-privacy-policy-title" key="privacy-title">
            {i18n.gettext('Privacy Policy')}
          </dt>,
          <dd key="privacy-contents">{privacyPolicyLink}</dd>,
        ])}

        {renderNodesIf(eulaLink, [
          <dt className="AddonMoreInfo-eula-title" key="eula-title">
            {i18n.gettext('End-User License Agreement')}
          </dt>,
          <dd key="eula-contents">{eulaLink}</dd>,
        ])}

        {renderNodesIf((versionHistoryLink || betaVersionsLink), [
          <dt className="AddonMoreInfo-version-history-title" key="history-title">
            {i18n.gettext('Version History')}
          </dt>,
          <dd key="history-contents">
            <ul className="AddonMoreInfo-links-contents-list">
              {versionHistoryLink}
              {betaVersionsLink}
            </ul>
          </dd>,
        ])}

        {renderNodesIf(statsLink, [
          <dt className="AddonMoreInfo-stats-title" key="stats-title">
            {i18n.gettext('Usage Statistics')}
          </dt>,
          <dd key="stats-contents">{statsLink}</dd>,
        ])}
      </dl>
    );
  }

  render() {
    const { addon, i18n } = this.props;

    return (
      <Card
        className="AddonMoreInfo"
        header={i18n.gettext('More information')}
      >
        <AddAddonToCollection
          className="AddonMoreInfo-add-to-collection"
          addon={addon}
        />

        {this.listContent()}
      </Card>
    );
  }
}

export const mapStateToProps = (state: {| users: UsersStateType |}) => {
  return {
    userId: state.users.currentUserID,
    hasStatsPermission: hasPermission(state, STATS_VIEW),
  };
};

export default compose(
  connect(mapStateToProps),
  translate(),
)(AddonMoreInfoBase);
