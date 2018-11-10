/* eslint-disable jsx-a11y/heading-has-content */
import defaultConfig from 'config';
import makeClassName from 'classnames';
import * as React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { setViewContext } from 'amo/actions/viewContext';
import AddAddonToCollection from 'amo/components/AddAddonToCollection';
import AddonBadges from 'amo/components/AddonBadges';
import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import AddonHead from 'amo/components/AddonHead';
import AddonMeta from 'amo/components/AddonMeta';
import AddonMoreInfo from 'amo/components/AddonMoreInfo';
import AddonRecommendations from 'amo/components/AddonRecommendations';
import AddonTitle from 'amo/components/AddonTitle';
import ContributeCard from 'amo/components/ContributeCard';
import AddonsByAuthorsCard from 'amo/components/AddonsByAuthorsCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import PermissionsCard from 'amo/components/PermissionsCard';
import DefaultRatingManager from 'amo/components/RatingManager';
import ScreenShots from 'amo/components/ScreenShots';
import Link from 'amo/components/Link';
import { getAddonsForSlug } from 'amo/reducers/addonsByAuthors';
import { getVersionById } from 'core/reducers/versions';
import { makeQueryStringWithUTM } from 'amo/utils';
import {
  fetchAddon,
  getAddonByID,
  getAddonBySlug,
  isAddonLoading,
} from 'core/reducers/addons';
import { sendServerRedirect } from 'core/reducers/redirectTo';
import { withFixedErrorHandler } from 'core/errorHandler';
import AMInstallButton from 'core/components/AMInstallButton';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_STATIC_THEME,
  ADDON_TYPE_THEME,
  INCOMPATIBLE_NOT_FIREFOX,
  INSTALL_SOURCE_DETAIL_PAGE,
  UNKNOWN,
} from 'core/constants';
import { withInstallHelpers } from 'core/installAddon';
import { isTheme, nl2br, sanitizeHTML, sanitizeUserHTML } from 'core/utils';
import { getErrorMessage } from 'core/utils/addons';
import { getClientCompatibility as _getClientCompatibility } from 'core/utils/compatibility';
import { getAddonIconUrl } from 'core/imageUtils';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';
import ShowMoreCard from 'ui/components/ShowMoreCard';
import ThemeImage from 'ui/components/ThemeImage';
import Notice from 'ui/components/Notice';

import './styles.scss';

// Find out if slug converts to a positive number/ID.
const slugIsPositiveID = (slug) => {
  // eslint-disable-next-line no-restricted-globals
  return !isNaN(slug) && parseInt(slug, 10) > 0;
};

export const STATUS_PUBLIC = 'public';

export class AddonBase extends React.Component {
  static propTypes = {
    RatingManager: PropTypes.func,
    addon: PropTypes.object,
    addonIsLoading: PropTypes.bool,
    clientApp: PropTypes.string.isRequired,
    config: PropTypes.object,
    currentVersion: PropTypes.object,
    defaultInstallSource: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    enable: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    getClientCompatibility: PropTypes.func,
    isAddonEnabled: PropTypes.func.isRequired,
    hasAddonManager: PropTypes.bool.isRequired,
    i18n: PropTypes.object.isRequired,
    install: PropTypes.func.isRequired,
    installError: PropTypes.string,
    installTheme: PropTypes.func.isRequired,
    lang: PropTypes.string.isRequired,
    platformFiles: PropTypes.object,
    uninstall: PropTypes.func.isRequired,
    // See ReactRouterLocationType in 'core/types/router'
    location: PropTypes.object.isRequired,
    match: PropTypes.shape({
      params: PropTypes.object.isRequired,
    }).isRequired,
    installStatus: PropTypes.string.isRequired,
    addonsByAuthors: PropTypes.array,
    userAgentInfo: PropTypes.object.isRequired,
  };

  static defaultProps = {
    config: defaultConfig,
    RatingManager: DefaultRatingManager,
    platformFiles: {},
    getClientCompatibility: _getClientCompatibility,
  };

  constructor(props) {
    super(props);

    const {
      addon,
      addonIsLoading,
      clientApp,
      dispatch,
      errorHandler,
      lang,
      match: { params },
    } = props;

    // This makes sure we do not try to dispatch any new actions in the case
    // of an error.
    if (!errorHandler.hasError()) {
      const { slug } = params;

      if (addon) {
        // We want to make sure the slug converts to a positive number/ID
        // before we try redirecting. We also want to make sure the case of the
        // slug parameter matches the add-on's slug case.
        if (slugIsPositiveID(slug) || addon.slug !== slug) {
          // We only load add-ons by slug, but ID must be supported too because
          // it is a legacy behavior.
          dispatch(
            sendServerRedirect({
              status: 301,
              url: `/${lang}/${clientApp}/addon/${addon.slug}/`,
            }),
          );
          return;
        }

        dispatch(setViewContext(addon.type));
      } else if (!addonIsLoading) {
        dispatch(fetchAddon({ slug, errorHandler }));
      }
    }
  }

  componentDidUpdate(prevProps) {
    const {
      addon: oldAddon,
      match: { params: oldParams },
    } = prevProps;
    const {
      addon: newAddon,
      addonIsLoading,
      dispatch,
      errorHandler,
      match: { params },
    } = this.props;

    const oldAddonType = oldAddon ? oldAddon.type : null;
    if (newAddon && newAddon.type !== oldAddonType) {
      dispatch(setViewContext(newAddon.type));
    }

    if (!addonIsLoading && (!newAddon || oldParams.slug !== params.slug)) {
      dispatch(fetchAddon({ slug: params.slug, errorHandler }));
    }
  }

  headerImage() {
    const { addon, i18n } = this.props;

    if (addon && isTheme(addon.type)) {
      return <ThemeImage addon={addon} roundedCorners />;
    }

    const label = addon
      ? i18n.sprintf(i18n.gettext('Preview of %(title)s'), {
          title: addon.name,
        })
      : null;

    return (
      <div className="Addon-icon" key="Addon-icon-header">
        <div className="Addon-icon-wrapper">
          <img
            alt={label}
            className="Addon-icon-image"
            src={getAddonIconUrl(addon)}
          />
        </div>
      </div>
    );
  }

  renderRatingsCard() {
    const { RatingManager, addon, i18n, location, currentVersion } = this.props;
    let content;
    let footerPropName = 'footerText';

    let ratingManager;
    if (addon && currentVersion) {
      ratingManager = (
        <RatingManager
          addon={addon}
          location={location}
          version={currentVersion}
        />
      );
    } else {
      ratingManager = (
        <p className="Addon-no-rating-manager">
          {i18n.gettext(`This add-on cannot be rated because no versions
            have been published.`)}
        </p>
      );
    }

    if (addon && addon.ratings.text_count) {
      const count = addon.ratings.text_count;
      const linkText = i18n.sprintf(
        i18n.ngettext(
          'Read %(count)s review',
          'Read all %(count)s reviews',
          count,
        ),
        { count: i18n.formatNumber(count) },
      );

      footerPropName = 'footerLink';
      content = (
        <Link
          className="Addon-all-reviews-link"
          to={`/addon/${addon.slug}/reviews/`}
        >
          {linkText}
        </Link>
      );
    } else if (!addon) {
      content = <LoadingText width={100} />;
    } else {
      content = i18n.gettext('No reviews yet');
    }

    const props = {
      [footerPropName]: (
        <div className="Addon-read-reviews-footer">{content}</div>
      ),
    };
    return (
      <Card
        header={i18n.gettext('Rate your experience')}
        className="Addon-overall-rating"
        {...props}
      >
        {ratingManager}
      </Card>
    );
  }

  renderShowMoreCard() {
    const { addon, i18n } = this.props;

    let title;
    const descriptionProps = {};
    let showAbout = true;

    if (addon) {
      switch (addon.type) {
        case ADDON_TYPE_DICT:
          title = i18n.gettext('About this dictionary');
          break;
        case ADDON_TYPE_EXTENSION:
          title = i18n.gettext('About this extension');
          break;
        case ADDON_TYPE_LANG:
          title = i18n.gettext('About this language pack');
          break;
        case ADDON_TYPE_OPENSEARCH:
          title = i18n.gettext('About this search plugin');
          break;
        case ADDON_TYPE_STATIC_THEME:
        case ADDON_TYPE_THEME:
          title = i18n.gettext('About this theme');
          break;
        default:
          title = i18n.gettext('About this add-on');
      }

      const description = addon.description ? addon.description : addon.summary;
      // For any theme type, we want to hide the summary text here since that is
      // already displayed in the header.
      showAbout =
        (description === addon.summary || addon.type === ADDON_TYPE_THEME) ===
        false;

      if (!description || !description.length) {
        return null;
      }
      descriptionProps.dangerouslySetInnerHTML = sanitizeUserHTML(description);
    } else {
      title = <LoadingText width={40} />;
      descriptionProps.children = <LoadingText width={100} />;
    }

    const showMoreCardName = 'AddonDescription';

    return showAbout ? (
      <ShowMoreCard
        className={showMoreCardName}
        header={title}
        id={showMoreCardName}
      >
        <div className="AddonDescription-contents" {...descriptionProps} />
      </ShowMoreCard>
    ) : null;
  }

  renderVersionReleaseNotes() {
    const { addon, i18n, currentVersion } = this.props;
    if (!addon) {
      return null;
    }

    if (!currentVersion || !currentVersion.releaseNotes) {
      return null;
    }

    const header = i18n.sprintf(
      i18n.gettext('Release notes for %(addonVersion)s'),
      { addonVersion: currentVersion.version },
    );
    const releaseNotes = sanitizeUserHTML(currentVersion.releaseNotes);

    const showMoreCardNotesName = 'AddonDescription-version-notes';

    /* eslint-disable react/no-danger */
    return (
      <ShowMoreCard
        className={showMoreCardNotesName}
        id={showMoreCardNotesName}
        header={header}
      >
        <div dangerouslySetInnerHTML={releaseNotes} />
      </ShowMoreCard>
    );
    /* eslint-enable react/no-danger */
  }

  renderAddonsByAuthorsCard({ isForTheme }) {
    const { addon } = this.props;
    const isThemeType = addon && isTheme(addon.type);
    if (
      !addon ||
      !addon.authors.length ||
      (isForTheme && !isThemeType) ||
      (!isForTheme && isThemeType)
    ) {
      return null;
    }

    /* Adding wrapping divs here seems to address what we think is a
      reconcillation issue —— which causes the classname to not always get added
      correctly (e.g.: when the page is refreshed and the addon has
      a description).
      See https://github.com/mozilla/addons-frontend/issues/4744
    */

    return (
      <div>
        <AddonsByAuthorsCard
          addonType={addon.type}
          authorDisplayName={addon.authors[0].name}
          authorIds={addon.authors.map((author) => author.id)}
          className="Addon-MoreAddonsCard"
          forAddonSlug={addon.slug}
          numberOfAddons={6}
        />
      </div>
    );
  }

  renderInstallError() {
    const { i18n, installError: error } = this.props;

    if (!error) {
      return null;
    }

    return (
      <Notice className="Addon-header-install-error" type="error">
        {getErrorMessage({ i18n, error })}
      </Notice>
    );
  }

  render() {
    const {
      addon,
      addonsByAuthors,
      clientApp,
      currentVersion,
      defaultInstallSource,
      enable,
      errorHandler,
      getClientCompatibility,
      hasAddonManager,
      isAddonEnabled,
      i18n,
      install,
      installStatus,
      installTheme,
      setCurrentStatus,
      uninstall,
      userAgentInfo,
    } = this.props;

    const isThemeType = addon && isTheme(addon.type);
    let errorBanner = null;
    if (errorHandler.hasError()) {
      log.warn('Captured API Error:', errorHandler.capturedError);

      // 401 and 403 are made to look like a 404 on purpose.
      // See: https://github.com/mozilla/addons-frontend/issues/3061.
      if (
        errorHandler.capturedError.responseStatusCode === 401 ||
        errorHandler.capturedError.responseStatusCode === 403 ||
        errorHandler.capturedError.responseStatusCode === 404
      ) {
        return <NotFound errorCode={errorHandler.capturedError.code} />;
      }

      // Show a list of errors at the top of the add-on section.
      errorBanner = errorHandler.renderError();
    }

    const addonType = addon ? addon.type : ADDON_TYPE_EXTENSION;

    const summaryProps = {};
    let showSummary = false;
    if (addon) {
      // Themes lack a summary so we do the inverse :-/
      // TODO: We should file an API bug about this...
      const summary = addon.summary ? addon.summary : addon.description;

      if (summary && summary.length) {
        summaryProps.dangerouslySetInnerHTML = sanitizeHTML(nl2br(summary), [
          'a',
          'br',
        ]);
        showSummary = true;
      }
    } else {
      summaryProps.children = <LoadingText width={100} />;
      showSummary = true;
    }

    const addonPreviews = addon ? addon.previews : [];

    let isCompatible = false;
    let compatibility;
    if (addon) {
      compatibility = getClientCompatibility({
        addon,
        clientApp,
        currentVersion,
        userAgentInfo,
      });
      isCompatible = compatibility.compatible;
    }

    const numberOfAddonsByAuthors = addonsByAuthors
      ? addonsByAuthors.length
      : 0;

    const isFireFox =
      compatibility && compatibility.reason !== INCOMPATIBLE_NOT_FIREFOX;
    const showInstallButton = addon && isFireFox;
    const showGetFirefoxButton = addon && !isFireFox;

    return (
      <div
        className={makeClassName('Addon', `Addon-${addonType}`, {
          'Addon-theme': isThemeType,
          'Addon--has-more-than-0-addons': numberOfAddonsByAuthors > 0,
          'Addon--has-more-than-3-addons': numberOfAddonsByAuthors > 3,
        })}
        data-site-identifier={addon ? addon.id : null}
      >
        <AddonHead addon={addon} />

        {errorBanner}

        <div className="Addon-header-wrapper">
          <Card className="Addon-header-info-card" photonStyle>
            {this.renderInstallError()}

            {isFireFox && !isCompatible ? (
              <AddonCompatibilityError
                className="Addon-header-compatibility-error"
                downloadUrl={compatibility.downloadUrl}
                maxVersion={compatibility.maxVersion}
                minVersion={compatibility.minVersion}
                reason={compatibility.reason}
              />
            ) : null}

            {addon && (addon.status !== STATUS_PUBLIC || addon.is_disabled) ? (
              <Notice type="error" className="Addon-non-public-notice">
                {i18n.gettext(
                  'This is not a public listing. You are only seeing it because of elevated permissions.',
                )}
              </Notice>
            ) : null}

            <header className="Addon-header">
              {this.headerImage()}

              <AddonTitle addon={addon} />

              <AddonBadges addon={addon} />

              <div className="Addon-summary-and-install-button-wrapper">
                {showSummary ? (
                  <p className="Addon-summary" {...summaryProps} />
                ) : null}

                {showInstallButton && (
                  <AMInstallButton
                    addon={addon}
                    currentVersion={currentVersion}
                    defaultInstallSource={defaultInstallSource}
                    disabled={!isCompatible}
                    enable={enable}
                    hasAddonManager={hasAddonManager}
                    install={install}
                    installTheme={installTheme}
                    setCurrentStatus={setCurrentStatus}
                    status={installStatus}
                    uninstall={uninstall}
                    isAddonEnabled={isAddonEnabled}
                  />
                )}
                {showGetFirefoxButton && (
                  <Button
                    buttonType="confirm"
                    href={`https://www.mozilla.org/firefox/new/${makeQueryStringWithUTM(
                      {
                        utm_content: addon.guid,
                      },
                    )}`}
                    puffy
                    className="Button--get-firefox"
                  >
                    {i18n.gettext('Only with Firefox—Get Firefox Now')}
                  </Button>
                )}
              </div>

              <h2 className="visually-hidden">
                {i18n.gettext('Extension Metadata')}
              </h2>
            </header>
          </Card>

          <Card className="Addon-header-meta-and-ratings" photonStyle>
            <AddonMeta addon={addon} />
          </Card>
        </div>

        <div className="Addon-details">
          <div className="Addon-main-content">
            {this.renderAddonsByAuthorsCard({ isForTheme: true })}

            {addonPreviews.length > 0 && !isThemeType ? (
              <Card
                className="Addon-screenshots"
                header={i18n.gettext('Screenshots')}
              >
                <ScreenShots previews={addonPreviews} />
              </Card>
            ) : null}

            {this.renderShowMoreCard()}

            {addonType === ADDON_TYPE_EXTENSION && (
              <AddonRecommendations addon={addon} />
            )}
          </div>

          {this.renderRatingsCard()}

          <ContributeCard addon={addon} />

          <AddAddonToCollection addon={addon} />

          <AddonMoreInfo addon={addon} />

          <PermissionsCard version={currentVersion} />

          {this.renderVersionReleaseNotes()}

          {this.renderAddonsByAuthorsCard({ isForTheme: false })}
        </div>
      </div>
    );
    // eslint-enable react/no-danger
  }
}

export function mapStateToProps(state, ownProps) {
  let { slug } = ownProps.match.params;
  slug = typeof slug === 'string' ? slug.trim() : slug;
  let addon = getAddonBySlug(state, slug);

  // It is possible to load an add-on by its ID but in the routing parameters,
  // the parameter is always named `slug`.
  if (slugIsPositiveID(slug)) {
    addon = getAddonByID(state, slug);
  }

  let addonsByAuthors;
  let installedAddon = {};
  let currentVersion = null;

  if (addon) {
    addonsByAuthors = getAddonsForSlug(state.addonsByAuthors, addon.slug);
    installedAddon = state.installations[addon.guid] || {};
    currentVersion = getVersionById({
      id: addon.currentVersionId,
      state: state.versions,
    });
  }

  return {
    addonIsLoading: isAddonLoading(state, slug),
    addonsByAuthors,
    clientApp: state.api.clientApp,
    installError: installedAddon.error,
    installStatus: installedAddon.status || UNKNOWN,
    lang: state.api.lang,
    // In addition to this component, this also is required by the
    // `withInstallHelpers()` HOC.
    addon,
    userAgentInfo: state.api.userAgentInfo,
    currentVersion,
  };
}

export const extractId = (ownProps) => {
  return ownProps.match.params.slug;
};

export default compose(
  translate(),
  connect(mapStateToProps),
  withInstallHelpers({ defaultInstallSource: INSTALL_SOURCE_DETAIL_PAGE }),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(AddonBase);
