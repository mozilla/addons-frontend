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
  headerText: string | null,
  // An undefined version means the versions are still loading, whereas a null
  // version means that no version exists.
  version: AddonVersionType | null | void,
|};

type InternalProps = {|
  ...Props,
  versionInfo: VersionInfoType | null,
  i18n: I18nType,
  installError: string | null,
|};

export const AddonVersionCardBase = (props: InternalProps) => {
  const { addon, headerText, i18n, installError, version, versionInfo } = props;

  if (version === null) {
    return (
      <li className="AddonVersionCard">
        <div>
          {headerText && (
            <h1 className="AddonVersionCard-header">{headerText}</h1>
          )}
          <h2 className="AddonVersionCard-noVersion">
            {i18n.gettext('No version found')}
          </h2>
        </div>
      </li>
    );
  }

  const versionNumber = version ? (
    i18n.sprintf(i18n.gettext('Version %(versionNumber)s'), {
      versionNumber: version.version,
    })
  ) : (
    <LoadingText />
  );

  const getFileInfoText = () => {
    if (!version) {
      return <LoadingText />;
    }

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

  let licenseSection = null;

  if (version) {
    const { license } = version;

    if (addon && license) {
      const otherVars = {
        licenseName: license.name,
      };

      if (license.url) {
        const licenseLinkParams = license.isCustom
          ? { to: `/addon/${addon.slug}/license/` }
          : { href: license.url, prependClientApp: false, prependLang: false };

        const licenseText = i18n.gettext(
          'Source code released under %(linkStart)s%(licenseName)s%(linkEnd)s',
        );

        const licenseLinkParts = getLocalizedTextWithLinkParts({
          i18n,
          text: licenseText,
          otherVars,
        });

        licenseSection = (
          <div className="AddonVersionCard-license">
            {licenseLinkParts.beforeLinkText}
            <Link {...licenseLinkParams}>{licenseLinkParts.innerLinkText}</Link>
            {licenseLinkParts.afterLinkText}
          </div>
        );
      } else {
        licenseSection = (
          <div className="AddonVersionCard-license">
            {i18n.sprintf(
              i18n.gettext('Source code released under %(licenseName)s'),
              otherVars,
            )}
          </div>
        );
      }
    }
  }

  return (
    <li className="AddonVersionCard">
      <div>
        {headerText && (
          <h1 className="AddonVersionCard-header">{headerText}</h1>
        )}

        {version && <AddonInstallError error={installError} />}
        {version && <AddonCompatibilityError addon={addon} version={version} />}

        <h2 className="AddonVersionCard-version">{versionNumber}</h2>
        {getFileInfoText()}

        {versionInfo && (
          <div className="AddonVersionCard-compatibility">
            {versionInfo.compatibilityString}
          </div>
        )}

        {version ? (
          <div
            className="AddonVersionCard-releaseNotes"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={sanitizeUserHTML(version.releaseNotes)}
          />
        ) : (
          <LoadingText />
        )}

        {licenseSection}
      </div>
      {addon && version && (
        <InstallButtonWrapper
          addon={addon}
          defaultInstallSource={INSTALL_SOURCE_DETAIL_PAGE}
          getFirefoxButtonType={GET_FIREFOX_BUTTON_TYPE_ADDON}
          version={version}
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
