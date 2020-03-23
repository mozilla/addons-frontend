/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import AddonAdminLinks from 'amo/components/AddonAdminLinks';
import Link from 'amo/components/Link';
import { getVersionById, getVersionInfo } from 'core/reducers/versions';
import { STATS_VIEW } from 'core/constants';
import translate from 'core/i18n/translate';
import { fetchCategories } from 'core/reducers/categories';
import { hasPermission } from 'amo/reducers/users';
import { isAddonAuthor, trimAndAddProtocolToUrl } from 'core/utils';
import Card from 'ui/components/Card';
import DefinitionList, { Definition } from 'ui/components/DefinitionList';
import LoadingText from 'ui/components/LoadingText';
import { addQueryParams } from 'core/utils/url';
import type { CategoriesStateType } from 'amo/components/Categories';
import type { AppState } from 'amo/store';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { AddonVersionType, VersionInfoType } from 'core/reducers/versions';
import type { AddonType } from 'core/types/addons';
import type { I18nType } from 'core/types/i18n';
import type { DispatchFunc } from 'core/types/redux';
import type { ReactRouterLocationType } from 'core/types/router';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
  i18n: I18nType,
|};

type InternalProps = {|
  ...Props,
  categoriesState: $PropertyType<CategoriesStateType, 'categories'>,
  clientApp: string | null,
  currentVersion: AddonVersionType | null,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  hasStatsPermission: boolean,
  loading: boolean,
  location: ReactRouterLocationType,
  userId: number | null,
  versionInfo: VersionInfoType | null,
|};

export class AddonMoreInfoBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);
    const { categoriesState, dispatch, errorHandler, loading } = props;

    if (!loading && !categoriesState) {
      dispatch(fetchCategories({ errorHandlerId: errorHandler.id }));
    }
  }

  listContent() {
    const {
      addon,
      currentVersion,
      hasStatsPermission,
      i18n,
      location,
      userId,
      versionInfo,
      clientApp,
      categoriesState,
      errorHandler,
      loading,
    } = this.props;

    if (!addon) {
      return this.renderDefinitions({
        versionLastUpdated: <LoadingText minWidth={20} />,
        versionLicense: <LoadingText minWidth={20} />,
      });
    }

    const addonType = addon.type;

    let categories = [];

    const reledCategories = [];

    if (
      categoriesState &&
      categoriesState[clientApp] &&
      categoriesState[clientApp][addonType]
    ) {
      categories = Object.keys(categoriesState[clientApp][addonType]).map(
        (key) => categoriesState[clientApp][addonType][key],
      );

      categories.forEach((r) => {
        if (addon.categories && addon.categories[clientApp].includes(r.slug)) {
          reledCategories.push(r.name);
        }
      });
    }

    if (!errorHandler.hasError() && !loading && !categories.length) {
      return (
        <Card>
          <p className="Categories-none-loaded-message">
            {i18n.gettext('No categories found.')}
          </p>
        </Card>
      );
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
          href={addQueryParams(`/addon/${addon.slug}/statistics/`, {
            src: location.query.src,
          })}
        >
          {i18n.gettext('Visit stats dashboard')}
        </Link>
      );
    }

    const lastUpdated = versionInfo && versionInfo.created;

    const license = currentVersion && currentVersion.license;
    let versionLicenseLink = null;

    if (license) {
      const linkProps = license.isCustom
        ? {
            to: addQueryParams(`/addon/${addon.slug}/license/`, {
              src: location.query.src,
            }),
          }
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
      version: currentVersion ? currentVersion.version : null,
      filesize: versionInfo && versionInfo.filesize,
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
          to={addQueryParams(`/addon/${addon.slug}/privacy/`, {
            src: location.query.src,
          })}
        >
          {i18n.gettext('Read the privacy policy for this add-on')}
        </Link>
      ) : null,
      eulaLink: addon.has_eula ? (
        <Link
          className="AddonMoreInfo-eula-link"
          to={addQueryParams(`/addon/${addon.slug}/eula/`, {
            src: location.query.src,
          })}
        >
          {i18n.gettext('Read the license agreement for this add-on')}
        </Link>
      ) : null,
      relatedCategories:
        reledCategories && reledCategories.length > 0
          ? i18n.gettext(reledCategories.join(', '))
          : null,
      versionHistoryLink: (
        <li>
          <Link
            className="AddonMoreInfo-version-history-link"
            to={addQueryParams(`/addon/${addon.slug}/versions/`, {
              src: location.query.src,
            })}
          >
            {i18n.gettext('See all versions')}
          </Link>
        </li>
      ),
    });
  }

  renderDefinitions({
    homepage = null,
    supportUrl = null,
    supportEmail = null,
    statsLink = null,
    privacyPolicyLink = null,
    eulaLink = null,
    filesize = null,
    relatedCategories = null,
    version = null,
    versionLastUpdated,
    versionLicenseLink = null,
    versionHistoryLink = null,
  }: Object) {
    const { addon, i18n, errorHandler } = this.props;
    return (
      <>
        {errorHandler.renderErrorIfPresent()}
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
          {filesize && (
            <Definition
              className="AddonMoreInfo-filesize"
              term={i18n.gettext('Size')}
            >
              {filesize}
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
          {relatedCategories && (
            <Definition
              className="AddonMoreInfo-related-categories"
              term={i18n.gettext('Related Categories')}
            >
              {relatedCategories}
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
      </>
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
  const { addon, i18n } = ownProps;
  let currentVersion = null;
  let versionInfo = null;

  if (addon && addon.currentVersionId) {
    currentVersion = getVersionById({
      id: addon.currentVersionId,
      state: state.versions,
    });
  }

  if (currentVersion) {
    versionInfo = getVersionInfo({
      i18n,
      state: state.versions,
      userAgentInfo: state.api.userAgentInfo,
      versionId: currentVersion.id,
    });
  }

  return {
    currentVersion,
    versionInfo,
    hasStatsPermission: hasPermission(state, STATS_VIEW),
    userId: state.users.currentUserID,
    clientApp: state.api.clientApp,
    loading: state.categories.loading,
    categoriesState: state.categories.categories,
  };
};

const AddonMoreInfo: React.ComponentType<Props> = compose(
  withRouter,
  translate(),
  connect(mapStateToProps),
)(AddonMoreInfoBase);

export default AddonMoreInfo;
