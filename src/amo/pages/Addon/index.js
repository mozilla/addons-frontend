/* eslint-disable jsx-a11y/heading-has-content */
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
import AddonInstallError from 'amo/components/AddonInstallError';
import AddonMoreInfo from 'amo/components/AddonMoreInfo';
import AddonRecommendations from 'amo/components/AddonRecommendations';
import AddonTitle from 'amo/components/AddonTitle';
import AddonsByAuthorsCard from 'amo/components/AddonsByAuthorsCard';
import ContributeCard from 'amo/components/ContributeCard';
import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import InstallWarning from 'amo/components/InstallWarning';
import Page from 'amo/components/Page';
import PermissionsCard from 'amo/components/PermissionsCard';
import DefaultRatingManager from 'amo/components/RatingManager';
import ScreenShots from 'amo/components/ScreenShots';
import Link from 'amo/components/Link';
import WrongPlatformWarning from 'amo/components/WrongPlatformWarning';
import {
  EXPERIMENT_CONFIG,
  VARIANT_SHOW_MIDDLE,
  VARIANT_SHOW_TOP,
  shouldExcludeUser,
} from 'amo/experiments/20221130_amo_detail_category';
import { getAddonsForSlug } from 'amo/reducers/addonsByAuthors';
import { reviewListURL } from 'amo/reducers/reviews';
import { getAddonURL, sanitizeUserHTML } from 'amo/utils';
import { getVersionById } from 'amo/reducers/versions';
import {
  fetchAddon,
  getAddonByIdInURL,
  isAddonLoading,
} from 'amo/reducers/addons';
import { sendServerRedirect } from 'amo/reducers/redirectTo';
import { withFixedErrorHandler } from 'amo/errorHandler';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_FIREFOX,
} from 'amo/constants';
import { getAddonIconUrl } from 'amo/imageUtils';
import translate from 'amo/i18n/translate';
import Card from 'amo/components/Card';
import LoadingText from 'amo/components/LoadingText';
import ShowMoreCard from 'amo/components/ShowMoreCard';
import ThemeImage from 'amo/components/ThemeImage';
import Notice from 'amo/components/Notice';
import AddonSuggestions from 'amo/components/AddonSuggestions';
import { withExperiment } from 'amo/withExperiment';

import './styles.scss';

export const STATUS_PUBLIC = 'public';
export const ADDONS_BY_AUTHORS_COUNT = 6;

export class AddonBase extends React.Component {
  static propTypes = {
    RatingManager: PropTypes.func,
    addon: PropTypes.object,
    addonIsLoading: PropTypes.bool,
    clientApp: PropTypes.string.isRequired,
    currentVersion: PropTypes.object,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
    installError: PropTypes.string,
    lang: PropTypes.string.isRequired,
    // See ReactRouterLocationType in 'amo/types/router'
    location: PropTypes.object.isRequired,
    match: PropTypes.shape({
      params: PropTypes.object.isRequired,
    }).isRequired,
    addonsByAuthors: PropTypes.array,
    variant: PropTypes.string.isRequired,
  };

  static defaultProps = {
    RatingManager: DefaultRatingManager,
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
      if (addon) {
        // If the slug (which is actually the URL parameter) does not match the
        // add-on's slug, it means the URL isn't the "canonical URL" and we
        // have to send a server redirect to fix that. The URL can contain an
        // add-on ID, a GUID or the actual slug. In some cases, it can have
        // trailing spaces or slightly different characters. As far as the API
        // returns an add-on for the value of this parameter, we should be able
        // to display it, after the redirect below.
        if (addon.slug !== params.slug) {
          // We only load add-ons by slug, but ID must be supported too because
          // it is a legacy behavior.
          dispatch(
            sendServerRedirect({
              status: 301,
              url: `/${lang}/${clientApp}${getAddonURL(addon.slug)}`,
            }),
          );
          return;
        }

        dispatch(setViewContext(addon.type));
      } else if (!addonIsLoading) {
        dispatch(
          fetchAddon({
            showGroupedRatings: true,
            slug: params.slug,
            errorHandler,
          }),
        );
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

    if (errorHandler.hasError()) {
      return;
    }

    const oldAddonType = oldAddon ? oldAddon.type : null;
    if (newAddon && newAddon.type !== oldAddonType) {
      dispatch(setViewContext(newAddon.type));
    }

    if (!addonIsLoading && (!newAddon || oldParams.slug !== params.slug)) {
      dispatch(
        fetchAddon({
          showGroupedRatings: true,
          slug: params.slug,
          errorHandler,
        }),
      );
    }
  }

  renderThemeThumbnail() {
    const { addon } = this.props;

    if (!addon || addon.type !== ADDON_TYPE_STATIC_THEME) return null;

    return <ThemeImage addon={addon} roundedCorners />;
  }

  headerImage() {
    const { addon, i18n } = this.props;

    if (addon && ADDON_TYPE_STATIC_THEME === addon.type) {
      return null;
    }

    const label = addon
      ? i18n.sprintf(i18n.gettext('Preview of %(title)s'), {
          title: addon.name,
        })
      : null;

    return (
      <div className="Addon-icon-wrapper">
        <img
          alt={label}
          className="Addon-icon-image"
          src={getAddonIconUrl(addon)}
        />
      </div>
    );
  }

  renderRatingsCard() {
    const { RatingManager, addon, i18n, location, currentVersion } = this.props;
    let content;
    let footerPropName = 'footerText';

    let ratingManager;
    if (addon && currentVersion) {
      ratingManager = <RatingManager addon={addon} version={currentVersion} />;
    } else {
      ratingManager = (
        <p className="Addon-no-rating-manager">
          {i18n.gettext(`This add-on cannot be rated because no versions
            have been published.`)}
        </p>
      );
    }

    if (!addon) {
      content = <LoadingText width={100} />;
    } else if (addon.ratings && addon.ratings.count) {
      const { count } = addon.ratings;
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
          to={reviewListURL({
            addonSlug: addon.slug,
            location,
          })}
        >
          {linkText}
        </Link>
      );
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

    let showAbout;
    let title;
    const descriptionProps = {};

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
        case ADDON_TYPE_STATIC_THEME:
          title = i18n.gettext('About this theme');
          break;
        default:
          title = i18n.gettext('About this add-on');
      }

      if (addon.description && addon.description.length) {
        descriptionProps.dangerouslySetInnerHTML = sanitizeUserHTML(
          addon.description,
        );
      }
      showAbout = addon.description || addon.developer_comments;
    } else {
      showAbout = true;
      title = <LoadingText width={40} />;
      descriptionProps.children = <LoadingText width={100} />;
    }

    const showMoreCardName = 'AddonDescription';

    return showAbout ? (
      <ShowMoreCard
        contentId={addon && addon.id}
        className={showMoreCardName}
        header={title}
        id={showMoreCardName}
        maxHeight={300}
      >
        {descriptionProps && Object.keys(descriptionProps).length ? (
          <div className="AddonDescription-contents" {...descriptionProps} />
        ) : null}
        {addon && addon.developer_comments ? (
          /* eslint-disable react/no-danger */
          <div className="Addon-developer-comments">
            <header className="Addon-developer-comments-header">
              {i18n.gettext('Developer comments')}
            </header>
            <div
              className="Addon-developer-comments-contents"
              dangerouslySetInnerHTML={sanitizeUserHTML(
                addon.developer_comments,
              )}
            />
          </div>
        ) : null}
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
        contentId={addon.id}
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
    const isThemeType = addon && ADDON_TYPE_STATIC_THEME === addon.type;
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
          numberOfAddons={ADDONS_BY_AUTHORS_COUNT}
        />
      </div>
    );
  }

  renderCategorySuggestions(requiredVariant) {
    const { addon, clientApp, variant } = this.props;

    if (variant !== requiredVariant || shouldExcludeUser({ clientApp })) {
      return null;
    }

    return <AddonSuggestions addon={addon} />;
  }

  renderRecommendations() {
    const { addon, clientApp } = this.props;
    const addonType = addon ? addon.type : ADDON_TYPE_EXTENSION;

    if (
      addonType === ADDON_TYPE_EXTENSION &&
      clientApp === CLIENT_APP_FIREFOX
    ) {
      return <AddonRecommendations addon={addon} />;
    }

    return null;
  }

  render() {
    const {
      addon,
      addonsByAuthors,
      clientApp,
      currentVersion,
      errorHandler,
      i18n,
    } = this.props;

    const isThemeType = addon && addon.type === ADDON_TYPE_STATIC_THEME;
    let errorBanner = null;
    if (errorHandler.hasError()) {
      // Show a list of errors at the top of the add-on section.
      errorBanner = errorHandler.renderError();
    }

    const addonType = addon ? addon.type : ADDON_TYPE_EXTENSION;

    const showSummary = !addon || addon.summary?.length;
    const summary = (
      <p className="Addon-summary">{addon ? addon.summary : <LoadingText />}</p>
    );

    const addonPreviews = addon ? addon.previews : [];

    const numberOfAddonsByAuthors = addonsByAuthors
      ? addonsByAuthors.length
      : 0;

    return (
      <Page
        showVPNPromo={Boolean(addon && addon.type === ADDON_TYPE_EXTENSION)}
        errorHandler={errorHandler}
        isAddonInstallPage
        showWrongPlatformWarning={false}
        includeGoogleDisclaimerInFooter={
          clientApp === CLIENT_APP_FIREFOX && !!addon?.isAndroidCompatible
        }
      >
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

          {this.renderCategorySuggestions(VARIANT_SHOW_TOP)}

          <div>
            <Card className="Addon-header-info-card" photonStyle>
              <AddonInstallError error={this.props.installError} />

              <AddonCompatibilityError addon={addon} />

              {addon &&
              (addon.status !== STATUS_PUBLIC || addon.is_disabled) ? (
                <Notice type="error" className="Addon-non-public-notice">
                  {i18n.gettext(
                    'This is not a public listing. You are only seeing it because of elevated permissions.',
                  )}
                </Notice>
              ) : null}

              <div className="Addon-theme-thumbnail">
                {this.renderThemeThumbnail()}
              </div>

              <header className="Addon-header">
                {this.headerImage()}

                <div className="Addon-info">
                  <AddonTitle addon={addon} />
                  {showSummary ? summary : null}

                  {addon && <InstallWarning addon={addon} />}
                  {addon ? (
                    <WrongPlatformWarning
                      addon={addon}
                      className="Addon-WrongPlatformWarning"
                    />
                  ) : null}
                </div>
                <AddonBadges addon={addon} />
                <div className="Addon-install">
                  <InstallButtonWrapper addon={addon} />
                </div>

                <h2 className="visually-hidden">
                  {i18n.gettext('Extension Metadata')}
                </h2>
              </header>
            </Card>
          </div>

          {this.renderCategorySuggestions(VARIANT_SHOW_MIDDLE)}

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

              {this.renderRatingsCard()}

              {this.renderRecommendations()}
            </div>

            <ContributeCard addon={addon} />

            <PermissionsCard version={currentVersion} />

            <AddonMoreInfo addon={addon} />

            <AddAddonToCollection addon={addon} />

            {this.renderVersionReleaseNotes()}

            {this.renderAddonsByAuthorsCard({ isForTheme: false })}
          </div>
        </div>
      </Page>
    );
    // eslint-enable react/no-danger
  }
}

function mapStateToProps(state, ownProps) {
  const { slug } = ownProps.match.params;
  const addon = getAddonByIdInURL(state.addons, slug);

  let addonsByAuthors;
  let installedAddon = {};
  let currentVersion = null;

  if (addon) {
    addonsByAuthors = getAddonsForSlug(state.addonsByAuthors, addon.slug);
    installedAddon = state.installations[addon.guid] || {};
    currentVersion = addon.currentVersionId
      ? getVersionById({
          id: addon.currentVersionId,
          state: state.versions,
        })
      : null;
  }

  return {
    addonIsLoading: isAddonLoading(state, slug),
    addonsByAuthors,
    clientApp: state.api.clientApp,
    currentVersion,
    installError: installedAddon.error,
    lang: state.api.lang,
    // The `withInstallHelpers` HOC requires an `addon` prop too:
    addon,
  };
}

export const extractId = (ownProps) => {
  return ownProps.match.params.slug;
};

export default compose(
  translate(),
  connect(mapStateToProps),
  withFixedErrorHandler({ fileName: __filename, extractId }),
  withExperiment({ experimentConfig: EXPERIMENT_CONFIG }),
)(AddonBase);
