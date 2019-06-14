/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonAdminLinks from 'amo/components/AddonAdminLinks';
import Link from 'amo/components/Link';
import { getVersionById } from 'core/reducers/versions';
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
import DefinitionList, { Definition } from 'ui/components/DefinitionList';
import LoadingText from 'ui/components/LoadingText';
import type { AddonVersionType } from 'core/reducers/versions';
import type { AppState } from 'amo/store';
import type { I18nType } from 'core/types/i18n';
import { formatFilesize } from 'core/i18n/utils';

type Props = {|
  addon: AddonType | null,
|};

type InternalProps = {|
  ...Props,
  hasStatsPermission: boolean,
  i18n: I18nType,
  userId: number | null,
  currentVersion: AddonVersionType | null,
|};

export class AddonMoreInfoBase extends React.Component<InternalProps> {
  listContent() {
    const {
      addon,
      hasStatsPermission,
      i18n,
      userId,
      currentVersion,
    } = this.props;

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
            {i18n.gettext('Support site')}
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
    if (
      isAddonAuthor({ addon, userId }) ||
      addon.public_stats ||
      hasStatsPermission
    ) {
      statsLink = (
        <Link
          className="AddonMoreInfo-stats-link"
          href={`/addon/${addon.slug}/statistics/`}
        >
          {i18n.gettext('Visit stats dashboard')}
        </Link>
      );
    }

    const lastUpdated = addon.last_updated;
    const license = currentVersion && currentVersion.license;
    let versionLicenseLink = null;
    const { platformFiles } = currentVersion;
    const fileSize = formatFilesize({ i18n, size: platformFiles.all.size });

    if (license) {
      const linkProps = license.isCustom
        ? { to: `/addon/${addon.slug}/license/` }
        : { href: license.url, prependClientApp: false, prependLang: false };
      const licenseName = license.name || i18n.gettext('Custom License');

      versionLicenseLink = license.url ? (
        <Link className="AddonMoreInfo-license-link" {...linkProps}>
          {licenseName}
        </Link>
      ) : (
        <span className="AddonMoreInfo-license-name">{licenseName}</span>
      );
    }

    return this.renderDefinitions({
      homepage,
      supportUrl,
      supportEmail,
      statsLink,
      version:
        currentVersion && addonHasVersionHistory(addon)
          ? currentVersion.version
          : null,
      fileSize,
      versionLastUpdated: lastUpdated
        ? i18n.sprintf(
            // translators: This will output, in English:
            // "2 months ago (Dec 12 2016)"
            i18n.gettext('%(timeFromNow)s (%(date)s)'),
            {
              timeFromNow: i18n.moment(lastUpdated).fromNow(),
              date: i18n.moment(lastUpdated).format('ll'),
            },
          )
        : null,
      versionLicenseLink,
      privacyPolicyLink: addon.has_privacy_policy ? (
        <Link
          className="AddonMoreInfo-privacy-policy-link"
          to={`/addon/${addon.slug}/privacy/`}
        >
          {i18n.gettext('Read the privacy policy for this add-on')}
        </Link>
      ) : null,
      eulaLink: addon.has_eula ? (
        <Link
          className="AddonMoreInfo-eula-link"
          to={`/addon/${addon.slug}/eula/`}
        >
          {i18n.gettext('Read the license agreement for this add-on')}
        </Link>
      ) : null,
      versionHistoryLink: addonHasVersionHistory(addon) ? (
        <li>
          <Link
            className="AddonMoreInfo-version-history-link"
            to={`/addon/${addon.slug}/versions/`}
          >
            {i18n.gettext('See all versions')}
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
    fileSize = null,
    versionLastUpdated,
    versionLicenseLink = null,
    versionHistoryLink = null,
  }: Object) {
    const { addon, i18n } = this.props;
    return (
      <React.Fragment>
        <DefinitionList className="AddonMoreInfo-dl">
          {(homepage || supportUrl || supportEmail) && (
            <Definition
              className="AddonMoreInfo-links"
              term={i18n.gettext('Add-on Links')}
            >
              <ul className="AddonMoreInfo-links-contents-list">
                {homepage}
                {supportUrl}
                {supportEmail}
              </ul>
            </Definition>
          )}
          {version && (
            <Definition
              className="AddonMoreInfo-version"
              term={i18n.gettext('Version')}
            >
              {version}
            </Definition>
          )}
          {fileSize && (
            <Definition
              className="AddonMoreInfo-size"
              term={i18n.gettext('Size')}
            >
              {fileSize}
            </Definition>
          )}
          {versionLastUpdated && (
            <Definition
              className="AddonMoreInfo-last-updated"
              term={i18n.gettext('Last updated')}
            >
              {versionLastUpdated}
            </Definition>
          )}
          {versionLicenseLink && (
            <Definition
              className="AddonMoreInfo-license"
              term={i18n.gettext('License')}
            >
              {versionLicenseLink}
            </Definition>
          )}
          {privacyPolicyLink && (
            <Definition
              className="AddonMoreInfo-privacy-policy"
              term={i18n.gettext('Privacy Policy')}
            >
              {privacyPolicyLink}
            </Definition>
          )}
          {eulaLink && (
            <Definition
              className="AddonMoreInfo-eula"
              term={i18n.gettext('End-User License Agreement')}
            >
              {eulaLink}
            </Definition>
          )}
          {versionHistoryLink && (
            <Definition
              className="AddonMoreInfo-version-history"
              term={i18n.gettext('Version History')}
            >
              <ul className="AddonMoreInfo-links-contents-list">
                {versionHistoryLink}
              </ul>
            </Definition>
          )}
          {statsLink && (
            <Definition
              className="AddonMoreInfo-stats"
              term={i18n.gettext('Usage Statistics')}
            >
              {statsLink}
            </Definition>
          )}
        </DefinitionList>
        <AddonAdminLinks addon={addon} />
      </React.Fragment>
    );
  }

  render() {
    const { i18n } = this.props;

    return (
      <Card className="AddonMoreInfo" header={i18n.gettext('More information')}>
        {this.listContent()}
      </Card>
    );
  }
}

export const mapStateToProps = (state: AppState, ownProps: Props) => {
  const { addon } = ownProps;
  return {
    hasStatsPermission: hasPermission(state, STATS_VIEW),
    userId: state.users.currentUserID,
    currentVersion:
      addon && addon.currentVersionId
        ? getVersionById({ id: addon.currentVersionId, state: state.versions })
        : null,
  };
};

const AddonMoreInfo: React.ComponentType<Props> = compose(
  connect(mapStateToProps),
  translate(),
)(AddonMoreInfoBase);

export default AddonMoreInfo;
