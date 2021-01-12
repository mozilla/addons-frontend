/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import AddonInstallError from 'amo/components/AddonInstallError';
import { GET_FIREFOX_BUTTON_TYPE_ADDON } from 'amo/components/GetFirefoxButton';
import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import InstallWarning from 'amo/components/InstallWarning';
import Link from 'amo/components/Link';
import translate from 'amo/i18n/translate';
import { getVersionInfo } from 'amo/reducers/versions';
import { sanitizeUserHTML } from 'amo/utils';
import { replaceStringsWithJSX } from 'amo/i18n/utils';
import LoadingText from 'amo/components/LoadingText';
import type { AppState } from 'amo/store';
import type { AddonVersionType, VersionInfoType } from 'amo/reducers/versions';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
  headerText: string | null,
  // An undefined version means the versions are still loading, whereas a null
  // version means that no version exists.
  version: AddonVersionType | null | void,
  showButtonInsteadOfLink: boolean,
|};

type InternalProps = {|
  ...Props,
  versionInfo: VersionInfoType | null,
  i18n: I18nType,
  installError: string | null,
  showButtonInsteadOfLink: boolean,
|};

export const AddonVersionCardBase = (props: InternalProps) => {
  const {
    addon,
    headerText,
    i18n,
    installError,
    version,
    versionInfo,
    showButtonInsteadOfLink,
  } = props;

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
      if (license.url) {
        const licenseLinkParams = license.isCustom
          ? { to: `/addon/${addon.slug}/license/` }
          : { href: license.url, prependClientApp: false, prependLang: false };

        const licenseText = license.name
          ? i18n.sprintf(
              i18n.gettext(
                'Source code released under %(linkStart)s%(licenseName)s%(linkEnd)s',
              ),
              {
                licenseName: license.name,
                // Keep the link placeholders so that we can use them to inject a
                // `<Link />` using `replaceStringsWithJSX`.
                linkStart: '%(linkStart)s',
                linkEnd: '%(linkEnd)s',
              },
            )
          : i18n.gettext(
              'Source code released under %(linkStart)sCustom License%(linkEnd)s',
            );

        const licenseLink = replaceStringsWithJSX({
          text: licenseText,
          replacements: [
            [
              'linkStart',
              'linkEnd',
              (text) => (
                // eslint-disable-next-line react/prop-types
                <Link key={addon.slug} {...licenseLinkParams}>
                  {text}
                </Link>
              ),
            ],
          ],
        });

        licenseSection = (
          <p className="AddonVersionCard-license">{licenseLink}</p>
        );
      } else {
        licenseSection = (
          <p className="AddonVersionCard-license">
            {i18n.sprintf(
              i18n.gettext('Source code released under %(licenseName)s'),
              {
                licenseName: license.name,
              },
            )}
          </p>
        );
      }
    }
  }

  return (
    <li className="AddonVersionCard">
      <div className="AddonVersionCard-content">
        <div>
          {headerText && (
            <h1 className="AddonVersionCard-header">{headerText}</h1>
          )}

          {version && <AddonInstallError error={installError} />}
          {version && (
            <AddonCompatibilityError addon={addon} version={version} />
          )}

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
            getFirefoxButtonType={GET_FIREFOX_BUTTON_TYPE_ADDON}
            version={version}
            showButtonInsteadOfLink={showButtonInsteadOfLink}
          />
        )}
      </div>
      <div>{addon && <InstallWarning addon={addon} />}</div>
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
