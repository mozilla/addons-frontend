/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import ReportAbuseButton from 'amo/components/ReportAbuseButton';
import translate from 'core/i18n/translate';
import type { AddonType } from 'core/types/addons';
import {
  addonHasVersionHistory,
  isAddonAuthor,
  trimAndAddProtocolToUrl,
} from 'core/utils';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';

import './styles.scss';


type PropTypes = {
  addon: AddonType | null,
  i18n: Object,
  userId: number | null,
}

export class AddonMoreInfoBase extends React.Component {
  props: PropTypes;

  listContent() {
    const { addon, i18n, userId } = this.props;

    if (!addon) {
      return this.renderDefinitions({
        versionLastUpdated: <LoadingText minWidth={20} />,
        versionLicense: <LoadingText minWidth={20} />,
        addonId: <LoadingText minWidth={20} />,
      });
    }

    let homepage = trimAndAddProtocolToUrl(addon.homepage);
    if (homepage) {
      homepage = (
        <li><a className="AddonMoreInfo-homepage-link" href={homepage}>
          {i18n.gettext('Homepage')}
        </a></li>
      );
    }

    let supportUrl = trimAndAddProtocolToUrl(addon.support_url);
    if (supportUrl) {
      supportUrl = (
        <li><a className="AddonMoreInfo-support-link" href={supportUrl}>
          {i18n.gettext('Support Site')}
        </a></li>
      );
    }

    return this.renderDefinitions({
      homepage,
      supportUrl,
      statsLink: addon && isAddonAuthor({ addon, userId }) ? (
        <Link
          className="AddonMoreInfo-stats-link"
          href={`/addon/${addon.slug}/statistics/`}
        >
          {i18n.gettext('Visit stats dashboard')}
        </Link>
      ) : null,
      version: addonHasVersionHistory(addon) ?
        addon.current_version.version : null,
      versionLastUpdated: i18n.sprintf(
        // translators: This will output, in English:
        // "2 months ago (Dec 12 2016)"
        i18n.gettext('%(timeFromNow)s (%(date)s)'), {
          timeFromNow: i18n.moment(addon.last_updated).fromNow(),
          date: i18n.moment(addon.last_updated).format('ll'),
        }
      ),
      versionLicenseLink: addon.current_version.license ? (
        <Link
          className="AddonMoreInfo-license-link"
          href={addon.current_version.license.url}
          prependClientApp={false}
          prependLang={false}
        >
          {addon.current_version.license.name}
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
      addonId: addon.id,
      versionHistoryLink: addonHasVersionHistory(addon) ? (
        <Link
          className="AddonMoreInfo-version-history-link"
          href={`/addon/${addon.slug}/versions/`}
        >
          {i18n.gettext('See all versions')}
        </Link>
      ) : null,
      // Since current_beta_version is just an alias to the latest beta,
      // we can assume that no betas exist at all if it is null.
      betaVersionsLink: addon.current_beta_version ? (
        <Link
          className="AddonMoreInfo-beta-versions-link"
          href={`/addon/${addon.slug}/versions/beta`}
        >
          {i18n.gettext('See all beta versions')}
        </Link>
      ) : null,
    });
  }

  renderDefinitions({
    homepage = null,
    supportUrl = null,
    statsLink = null,
    privacyPolicyLink = null,
    eulaLink = null,
    version = null,
    versionLastUpdated,
    versionLicenseLink = null,
    versionHistoryLink = null,
    betaVersionsLink = null,
    addonId,
  }: Object) {
    const { i18n } = this.props;
    return (
      <dl className="AddonMoreInfo-contents">
        {homepage || supportUrl ? (
          <dt className="AddonMoreInfo-links-title">
            {i18n.gettext('Add-on Links')}
          </dt>
        ) : null}
        {homepage || supportUrl ? (
          <dd className="AddonMoreInfo-links-contents">
            <ul className="AddonMoreInfo-links-contents-list">
              {homepage}
              {supportUrl}
            </ul>
          </dd>
        ) : null}
        {version ? (
          <dt className="AddonMoreInfo-version-title">
            {i18n.gettext('Version')}
          </dt>
        ) : null}
        {version ? <dd className="AddonMoreInfo-version">{version}</dd> : null}
        <dt className="AddonMoreInfo-last-updated-title">
          {i18n.gettext('Last updated')}
        </dt>
        <dd>{versionLastUpdated}</dd>
        {versionLicenseLink ? (
          <dt className="AddonMoreInfo-license-title">
            {i18n.gettext('License')}
          </dt>
        ) : null}
        {versionLicenseLink ? <dd>{versionLicenseLink}</dd> : null}
        {privacyPolicyLink ? (
          <dt className="AddonMoreInfo-privacy-policy-title">
            {i18n.gettext('Privacy Policy')}
          </dt>
        ) : null}
        {privacyPolicyLink ? <dd>{privacyPolicyLink}</dd> : null}
        {eulaLink ? (
          <dt className="AddonMoreInfo-eula-title">
            {i18n.gettext('End-User License Agreement')}
          </dt>
        ) : null}
        {eulaLink ? <dd>{eulaLink}</dd> : null}
        {versionHistoryLink ? (
          <dt className="AddonMoreInfo-version-history-title">
            {i18n.gettext('Version History')}
          </dt>
        ) : null}
        {versionHistoryLink ? <dd>{versionHistoryLink}</dd> : null}
        {betaVersionsLink ? (
          <dt className="AddonMoreInfo-beta-versions-title">
            {i18n.gettext('Beta Versions')}
          </dt>
        ) : null}
        {betaVersionsLink ? <dd>{betaVersionsLink}</dd> : null}
        {statsLink ? (
          <dt className="AddonMoreInfo-stats-title">
            {i18n.gettext('Usage Statistics')}
          </dt>
        ) : null}
        {statsLink ? <dd>{statsLink}</dd> : null}
        <dt
          className="AddonMoreInfo-database-id-title"
          title={i18n.gettext(`This ID is useful for debugging and
            identifying your add-on to site administrators.`)}
        >
          {i18n.gettext('Site Identifier')}
        </dt>
        <dd className="AddonMoreInfo-database-id-content">
          {addonId}
        </dd>
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
        {this.listContent()}

        <ReportAbuseButton addon={addon} />
      </Card>
    );
  }
}

export const mapStateToProps = (state: Object) => {
  return {
    userId: state.user.id,
  };
};

export default compose(
  connect(mapStateToProps),
  translate(),
)(AddonMoreInfoBase);
