/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import AddonInstallError from 'amo/components/AddonInstallError';
import { GET_FIREFOX_BUTTON_TYPE_ADDON } from 'amo/components/GetFirefoxButton';
import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import Link from 'amo/components/Link';
import { INSTALL_SOURCE_DETAIL_PAGE } from 'core/constants';
import translate from 'core/i18n/translate';
import { getVersionInfo } from 'core/reducers/versions';
import { sanitizeUserHTML } from 'core/utils';
import { getLocalizedTextWithLinkParts } from 'core/utils/i18n';
import LoadingText from 'ui/components/LoadingText';
import type { AppState } from 'amo/store';
import type { AddonVersionType, VersionInfoType } from 'core/reducers/versions';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
  version: AddonVersionType | null,
|};

type InternalProps = {|
  ...Props,
  versionInfo: VersionInfoType | null,
  i18n: I18nType,
  installError: string | null,
|};

export const AddonVersionCardBase = (props: InternalProps) => {
  const { addon, i18n, installError, version, versionInfo } = props;

  if (version === null) {
    return <LoadingText />;
  }

  const versionNumber = i18n.sprintf(
    i18n.gettext('Version %(versionNumber)s'),
    { versionNumber: version.version },
  );

  const getFileInfoText = () => {
    if (!versionInfo || !versionInfo.created || !versionInfo.filesize) {
      return null;
    }

    const i18nParams = {
      dateReleased: i18n.moment(versionInfo.created).format('ll'),
      fileSize: versionInfo.filesize,
    };

    return (
      <div className="AddonVersionCard-fileInfo">
        {i18n.sprintf(
          i18n.gettext('Released %(dateReleased)s - %(fileSize)s'),
          i18nParams,
        )}
      </div>
    );
  };

  const releaseNotes = sanitizeUserHTML(version.releaseNotes);

  let licenseLinkParams = {};
  let licenseLinkParts;
  let licenseText;
  const { license } = version;
  if (addon && license) {
    const otherVars = {
      licenseName: license.name,
    };
    licenseLinkParams = license.isCustom
      ? { to: `/addon/${addon.slug}/license/` }
      : { href: license.url, prependClientApp: false, prependLang: false };
    licenseText = i18n.gettext(
      'Source code released under %(linkStart)s%(licenseName)s%(linkEnd)s',
    );
    licenseLinkParts = getLocalizedTextWithLinkParts({
      i18n,
      text: licenseText,
      otherVars,
    });
  }

  return (
    <li className="AddonVersionCard">
      <AddonInstallError error={installError} />
      <AddonCompatibilityError addon={addon} />
      <div>
        <h2 className="AddonVersionCard-version">{versionNumber}</h2>
        {getFileInfoText()}
        {versionInfo && (
          <div className="AddonVersionCard-compatibility">
            {versionInfo.compatibilityString}
          </div>
        )}
        <div
          className="AddonVersionCard-releaseNotes"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={releaseNotes}
        />
        {licenseLinkParts && (
          <div className="AddonVersionCard-license">
            {licenseLinkParts.beforeLinkText}
            <Link {...licenseLinkParams}>{licenseLinkParts.innerLinkText}</Link>
            {licenseLinkParts.afterLinkText}
          </div>
        )}
      </div>
      {addon && (
        <InstallButtonWrapper
          addon={addon}
          defaultInstallSource={INSTALL_SOURCE_DETAIL_PAGE}
          getFirefoxButtonType={GET_FIREFOX_BUTTON_TYPE_ADDON}
        />
      )}
    </li>
  );
};

export function mapStateToProps(state: AppState, ownProps: InternalProps) {
  const { addon, i18n, version } = ownProps;

  let installedAddon = {};

  if (addon) {
    installedAddon = state.installations[addon.guid];
  }

  return {
    versionInfo: version
      ? getVersionInfo({
          i18n,
          state: state.versions,
          userAgentInfo: state.api.userAgentInfo,
          versionId: version.id,
        })
      : null,
    installError:
      installedAddon && installedAddon.error ? installedAddon.error : null,
  };
}

const AddonVersionCard: React.ComponentType<Props> = compose(
  translate(),
  connect(mapStateToProps),
)(AddonVersionCardBase);

export default AddonVersionCard;
