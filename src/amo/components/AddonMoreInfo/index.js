/* @flow */
import * as React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import AddonAdminLinks from 'amo/components/AddonAdminLinks';
import AddonAuthorLinks from 'amo/components/AddonAuthorLinks';
import Card from 'amo/components/Card';
import DefinitionList, { Definition } from 'amo/components/DefinitionList';
import Link from 'amo/components/Link';
import LoadingText from 'amo/components/LoadingText';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  STATS_VIEW,
} from 'amo/constants';
import { withErrorHandler } from 'amo/errorHandler';
import translate from 'amo/i18n/translate';
import { fetchCategories } from 'amo/reducers/categories';
import { hasPermission } from 'amo/reducers/users';
import { getVersionById, getVersionInfo } from 'amo/reducers/versions';
import { isAddonAuthor } from 'amo/utils';
import { getCategoryResultsPathname } from 'amo/utils/categories';
import { getTagResultsPathname } from 'amo/utils/tags';
import {
  addQueryParams,
  getQueryParametersForAttribution,
} from 'amo/utils/url';
import type { UserId } from 'amo/reducers/users';
import type { AddonVersionType, VersionInfoType } from 'amo/reducers/versions';
import type { AppState } from 'amo/store';
import type { AddonType } from 'amo/types/addons';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { I18nType } from 'amo/types/i18n';
import type { DispatchFunc } from 'amo/types/redux';
import type { ReactRouterLocationType } from 'amo/types/router';

type Props = {|
  addon: AddonType | null,
  i18n: I18nType,
|};

type PropsFromState = {|
  categoriesLoading: boolean,
  currentVersion: AddonVersionType | null,
  hasStatsPermission: boolean,
  relatedCategories: Array<Object> | null,
  userId: UserId | null,
  versionInfo: VersionInfoType | null,
|};

type InternalProps = {|
  ...Props,
  ...PropsFromState,
  dispatch: DispatchFunc,
  errorHandler: ErrorHandlerType,
  location: ReactRouterLocationType,
|};

export class AddonMoreInfoBase extends React.Component<InternalProps> {
  constructor(props: InternalProps) {
    super(props);

    const { categoriesLoading, dispatch, errorHandler, relatedCategories } =
      props;

    if (!categoriesLoading && !relatedCategories) {
      dispatch(fetchCategories({ errorHandlerId: errorHandler.id }));
    }
  }

  listContent(): React.Node {
    const {
      addon,
      currentVersion,
      hasStatsPermission,
      i18n,
      location,
      relatedCategories,
      userId,
      versionInfo,
    } = this.props;

    if (!addon) {
      return this.renderDefinitions({
        versionLastUpdated: <LoadingText minWidth={20} />,
        versionLicense: <LoadingText minWidth={20} />,
      });
    }

    let homepage: null | React.Element<'li'> | string =
      addon.homepage && addon.homepage.outgoing;
    if (homepage) {
      homepage = (
        <li>
          <a
            className="AddonMoreInfo-homepage-link"
            href={homepage}
            title={addon.homepage && addon.homepage.url}
            rel="nofollow"
          >
            {i18n.t('Homepage')}
          </a>
        </li>
      );
    }

    let supportUrl: null | React.Element<'li'> | string =
      addon.support_url && addon.support_url.outgoing;
    if (supportUrl) {
      supportUrl = (
        <li>
          <a
            className="AddonMoreInfo-support-link"
            href={supportUrl}
            title={addon.support_url && addon.support_url.url}
            rel="nofollow"
          >
            {i18n.t('Support site')}
          </a>
        </li>
      );
    }

    let supportEmail: React.Element<'li'> | null;
    if (addon.support_email && /.+@.+/.test(addon.support_email)) {
      supportEmail = (
        <li>
          <a
            className="AddonMoreInfo-support-email"
            href={`mailto:${addon.support_email}`}
          >
            {i18n.t('Support Email')}
          </a>
        </li>
      );
    } else {
      supportEmail = null;
    }

    let statsLink = null;
    if (isAddonAuthor({ addon, userId }) || hasStatsPermission) {
      statsLink = (
        <Link
          className="AddonMoreInfo-stats-link"
          href={addQueryParams(
            `/addon/${addon.slug}/statistics/`,
            getQueryParametersForAttribution(location),
          )}
        >
          {i18n.t('Visit stats dashboard')}
        </Link>
      );
    }

    const lastUpdated = versionInfo && versionInfo.created;

    const license = currentVersion && currentVersion.license;
    let versionLicenseLink = null;

    if (license) {
      const linkProps = license.isCustom
        ? {
            to: addQueryParams(
              `/addon/${addon.slug}/license/`,
              getQueryParametersForAttribution(location),
            ),
          }
        : { href: license.url, prependClientApp: false, prependLang: false };
      const licenseName = license.name || i18n.t('Custom License');

      versionLicenseLink = license.url ? (
        <Link className="AddonMoreInfo-license-link" {...linkProps}>
          {licenseName}
        </Link>
      ) : (
        <span className="AddonMoreInfo-license-name">{licenseName}</span>
      );
    }

    let categories = null;
    if (
      [ADDON_TYPE_EXTENSION, ADDON_TYPE_STATIC_THEME].includes(addon.type) &&
      relatedCategories &&
      relatedCategories.length > 0
    ) {
      // We receive translated category names from addon-server. no need to translate
      categories = relatedCategories.map((category) => {
        return (
          <li key={category.slug}>
            <Link
              className="AddonMoreInfo-related-category-link"
              to={getCategoryResultsPathname({
                addonType: category.type,
                slug: category.slug,
              })}
            >
              {category.name}
            </Link>
          </li>
        );
      });
    }

    return this.renderDefinitions({
      homepage,
      supportUrl,
      supportEmail,
      statsLink,
      version: currentVersion ? currentVersion.version : null,
      filesize: versionInfo && versionInfo.filesize,
      versionLastUpdated: lastUpdated
        ? i18n.t('%(timeFromNow)s (%(date)s)', {
            timeFromNow: i18n.moment(lastUpdated).fromNow(),
            date: i18n.moment(lastUpdated).format('ll'),
          })
        : null,
      versionLicenseLink,
      privacyPolicyLink: addon.has_privacy_policy ? (
        <Link
          className="AddonMoreInfo-privacy-policy-link"
          to={addQueryParams(
            `/addon/${addon.slug}/privacy/`,
            getQueryParametersForAttribution(location),
          )}
        >
          {i18n.t('Read the privacy policy for this add-on')}
        </Link>
      ) : null,
      eulaLink: addon.has_eula ? (
        <Link
          className="AddonMoreInfo-eula-link"
          to={addQueryParams(
            `/addon/${addon.slug}/eula/`,
            getQueryParametersForAttribution(location),
          )}
        >
          {i18n.t('Read the license agreement for this add-on')}
        </Link>
      ) : null,
      relatedCategories: categories,
      versionHistoryLink: (
        <li>
          <Link
            className="AddonMoreInfo-version-history-link"
            to={addQueryParams(
              `/addon/${addon.slug}/versions/`,
              getQueryParametersForAttribution(location),
            )}
          >
            {i18n.t('See all versions')}
          </Link>
        </li>
      ),

      tagsLinks:
        addon.tags.length > 0
          ? addon.tags.map((tag) => {
              return (
                <li key={tag}>
                  <Link
                    className="AddonMoreInfo-tag-link"
                    to={addQueryParams(
                      getTagResultsPathname({ tag }),
                      getQueryParametersForAttribution(location),
                    )}
                  >
                    {tag}
                  </Link>
                </li>
              );
            })
          : null,
    });
  }

  renderDefinitions({
    eulaLink = null,
    filesize = null,
    homepage = null,
    privacyPolicyLink = null,
    relatedCategories = null,
    statsLink = null,
    supportEmail = null,
    supportUrl = null,
    tagsLinks = null,
    version = null,
    versionHistoryLink = null,
    versionLastUpdated,
    versionLicenseLink = null,
  }: Object): React.Node {
    const { addon, i18n } = this.props;
    return (
      <>
        <DefinitionList className="AddonMoreInfo-dl">
          {(homepage || supportUrl || supportEmail) && (
            <Definition
              className="AddonMoreInfo-links"
              term={i18n.t('Add-on Links')}
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
              term={i18n.t('Version')}
            >
              {version}
            </Definition>
          )}

          {filesize && (
            <Definition
              className="AddonMoreInfo-filesize"
              term={i18n.t('Size')}
            >
              {filesize}
            </Definition>
          )}

          {versionLastUpdated && (
            <Definition
              className="AddonMoreInfo-last-updated"
              term={i18n.t('Last updated')}
            >
              {versionLastUpdated}
            </Definition>
          )}

          {relatedCategories && (
            <Definition
              className="AddonMoreInfo-related-categories"
              term={i18n.t('Related Categories')}
            >
              <ul className="AddonMoreInfo-related-categories-list">
                {relatedCategories}
              </ul>
            </Definition>
          )}

          {versionLicenseLink && (
            <Definition
              className="AddonMoreInfo-license"
              term={i18n.t('License')}
            >
              {versionLicenseLink}
            </Definition>
          )}

          {privacyPolicyLink && (
            <Definition
              className="AddonMoreInfo-privacy-policy"
              term={i18n.t('Privacy Policy')}
            >
              {privacyPolicyLink}
            </Definition>
          )}

          {eulaLink && (
            <Definition
              className="AddonMoreInfo-eula"
              term={i18n.t('End-User License Agreement')}
            >
              {eulaLink}
            </Definition>
          )}

          {versionHistoryLink && (
            <Definition
              className="AddonMoreInfo-version-history"
              term={i18n.t('Version History')}
            >
              <ul className="AddonMoreInfo-links-contents-list">
                {versionHistoryLink}
              </ul>
            </Definition>
          )}

          {statsLink && (
            <Definition
              className="AddonMoreInfo-stats"
              term={i18n.t('Usage Statistics')}
            >
              {statsLink}
            </Definition>
          )}

          {tagsLinks && (
            <Definition
              className="AddonMoreInfo-tag-links"
              term={i18n.t('Tags')}
            >
              <ul className="AddonMoreInfo-tag-links-list">{tagsLinks}</ul>
            </Definition>
          )}
        </DefinitionList>
        <AddonAdminLinks addon={addon} />
        <AddonAuthorLinks addon={addon} />
      </>
    );
  }

  render(): React.Node {
    const { errorHandler, i18n } = this.props;

    return (
      <Card className="AddonMoreInfo" header={i18n.t('More information')}>
        {errorHandler.renderErrorIfPresent()}

        {this.listContent()}
      </Card>
    );
  }
}

const mapStateToProps = (state: AppState, ownProps: Props): PropsFromState => {
  const { addon, i18n } = ownProps;
  const { categories } = state.categories;

  let currentVersion = null;
  let relatedCategories = null;
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
      versionId: currentVersion.id,
    });
  }

  if (addon && addon.categories && addon.type && categories) {
    const appCategories = categories[addon.type];
    const addonCategories = addon.categories || [];

    relatedCategories = addonCategories.reduce((result, slug) => {
      if (typeof appCategories[slug] !== 'undefined') {
        result.push(appCategories[slug]);
      }
      return result;
    }, []);
  }

  return {
    currentVersion,
    relatedCategories,
    versionInfo,
    categoriesLoading: state.categories.loading,
    hasStatsPermission: hasPermission(state, STATS_VIEW),
    userId: state.users.currentUserID,
  };
};

const AddonMoreInfo: React.ComponentType<Props> = compose(
  withRouter,
  translate(),
  connect(mapStateToProps),
  withErrorHandler({ name: 'AddonMoreInfo' }),
)(AddonMoreInfoBase);

export default AddonMoreInfo;
