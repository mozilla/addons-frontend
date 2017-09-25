import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';
import { trimAndAddProtocolToUrl } from 'core/utils';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';

import './styles.scss';


export class AddonMoreInfoBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  listContent() {
    const { addon, i18n } = this.props;

    if (!addon) {
      return this.renderDefinitions({
        version: <LoadingText minWidth={20} />,
        versionLastUpdated: <LoadingText minWidth={20} />,
        versionLicense: <LoadingText minWidth={20} />,
        addonId: <LoadingText minWidth={20} />,
        versionHistoryLink: <LoadingText minWidth={20} />,
        versionDevChannelLink: <LoadingText minWidth={20} />,
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
      version: addon.current_version.version,
      versionLastUpdated: i18n.sprintf(
        // translators: This will output, in English:
        // "2 months ago (Dec 12 2016)"
        i18n.gettext('%(timeFromNow)s (%(date)s)'), {
          timeFromNow: i18n.moment(addon.last_updated).fromNow(),
          date: i18n.moment(addon.last_updated).format('ll'),
        }
      ),
      versionLicenseLink: addon.current_version.license ? (
        <a
          className="AddonMoreInfo-license-link"
          href={addon.current_version.license.url}
        >
          {addon.current_version.license.name}
        </a>
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
      versionHistoryLink: (
        <a
          className="AddonMoreInfo-version-history-link"
          href={`/addon/${addon.slug}/versions/`}
        >
          {i18n.gettext('See all versions')}
        </a>
      ),
      versionDevChannelLink: (
        <a
          className="AddonMoreInfo-dev-channel-link"
          href={`/addon/${addon.slug}/versions/beta`}
        >
          {i18n.gettext('See experimental versions')}
        </a>
      ),
    });
  }

  renderDefinitions({
    homepage = null,
    supportUrl = null,
    privacyPolicyLink = null,
    eulaLink = null,
    version,
    versionLastUpdated,
    versionLicenseLink = null,
    versionHistoryLink,
    versionDevChannelLink,
    addonId,
  }) {
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
        <dt>{i18n.gettext('Version')}</dt>
        <dd className="AddonMoreInfo-version">{version}</dd>
        <dt>{i18n.gettext('Last updated')}</dt>
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
        <dt className="AddonMoreInfo-version-history-title">
          {i18n.gettext('Version History')}
        </dt>
        <dd>{versionHistoryLink}</dd>
        <dt className="AddonMoreInfo-dev-channel-title">
          {i18n.gettext('Development Channel')}
        </dt>
        <dd>{versionDevChannelLink}</dd>
      </dl>
    );
  }

  render() {
    const { i18n } = this.props;

    return (
      <Card
        className="AddonMoreInfo"
        header={i18n.gettext('More information')}
      >
        {this.listContent()}
      </Card>
    );
  }
}

export default compose(
  translate(),
)(AddonMoreInfoBase);
