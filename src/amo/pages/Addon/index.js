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
import AddonMeta from 'amo/components/AddonMeta';
import AddonMoreInfo from 'amo/components/AddonMoreInfo';
import AddonRecommendations from 'amo/components/AddonRecommendations';
import AddonTitle from 'amo/components/AddonTitle';
import AddonsByAuthorsCard from 'amo/components/AddonsByAuthorsCard';
import ContributeCard from 'amo/components/ContributeCard';
import { GET_FIREFOX_BUTTON_TYPE_ADDON } from 'amo/components/GetFirefoxButton';
import InstallWarning from 'amo/components/InstallWarning';
import InstallButtonWrapper from 'amo/components/InstallButtonWrapper';
import Page from 'amo/components/Page';
import PermissionsCard from 'amo/components/PermissionsCard';
import DefaultRatingManager from 'amo/components/RatingManager';
import ScreenShots from 'amo/components/ScreenShots';
import Link from 'amo/components/Link';
import WrongPlatformWarning from 'amo/components/WrongPlatformWarning';
import { getAddonsForSlug } from 'amo/reducers/addonsByAuthors';
import { reviewListURL } from 'amo/reducers/reviews';
import { getAddonURL } from 'amo/utils';
import { getVersionById } from 'core/reducers/versions';
import {
  fetchAddon,
  getAddonByIdInURL,
  isAddonLoading,
} from 'core/reducers/addons';
import { sendServerRedirect } from 'core/reducers/redirectTo';
import { withFixedErrorHandler } from 'core/errorHandler';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_STATIC_THEME,
} from 'core/constants';
import { nl2br, sanitizeHTML, sanitizeUserHTML } from 'core/utils';
import { getAddonIconUrl } from 'core/imageUtils';
import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';
import LoadingText from 'ui/components/LoadingText';
import ShowMoreCard from 'ui/components/ShowMoreCard';
import ThemeImage from 'ui/components/ThemeImage';
import Notice from 'ui/components/Notice';

import './styles.scss';

export const STATUS_PUBLIC = 'public';

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
    // See ReactRouterLocationType in 'core/types/router'
    location: PropTypes.object.isRequired,
    match: PropTypes.shape({
      params: PropTypes.object.isRequired,
    }).isRequired,
    addonsByAuthors: PropTypes.array,
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
        dispatch(fetchAddon({ slug: params.slug, errorHandler }));
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
      dispatch(fetchAddon({ slug: params.slug, errorHandler }));
    }
  }

  headerImage() {
    const { addon, i18n } = this.props;

    if (addon && ADDON_TYPE_STATIC_THEME === addon.type) {
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
        case ADDON_TYPE_STATIC_THEME:
          title = i18n.gettext('About this theme');
          break;
        default:
          title = i18n.gettext('About this add-on');
      }

      const description = addon.description ? addon.description : addon.summary;
      showAbout = description !== addon.summary;

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

  renderDevCommentsCard = () => {
    const { addon, i18n } = this.props;

    if (!addon || !addon.developer_comments) {
      return null;
    }

    const devComments = sanitizeUserHTML(addon.developer_comments);
    const showMoreCardName = 'Addon-developer-comments';

    /* eslint-disable react/no-danger */
    return (
      <ShowMoreCard
        className={showMoreCardName}
        header={i18n.gettext('Developer comments')}
        id={showMoreCardName}
      >
        <div
          className="Addon-developer-comments-contents"
          dangerouslySetInnerHTML={devComments}
        />
      </ShowMoreCard>
    );
    /* eslint-enable react/no-danger */
  };

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
          numberOfAddons={6}
        />
      </div>
    );
  }

  render() {
    const {
      addon,
      addonsByAuthors,
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

    const numberOfAddonsByAuthors = addonsByAuthors
      ? addonsByAuthors.length
      : 0;

    return (
      <Page errorHandler={errorHandler} showWrongPlatformWarning={false}>
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

              <header className="Addon-header">
                {this.headerImage()}

                <AddonTitle addon={addon} />

                <AddonBadges addon={addon} />

                <div className="Addon-summary-and-install-button-wrapper">
                  {showSummary ? (
                    <p className="Addon-summary" {...summaryProps} />
                  ) : null}

                  {addon && (
                    <InstallButtonWrapper
                      addon={addon}
                      getFirefoxButtonType={GET_FIREFOX_BUTTON_TYPE_ADDON}
                    />
                  )}
                </div>

                <h2 className="visually-hidden">
                  {i18n.gettext('Extension Metadata')}
                </h2>
              </header>
              {addon ? (
                <WrongPlatformWarning
                  addon={addon}
                  className="Addon-WrongPlatformWarning"
                />
              ) : null}
              {addon && <InstallWarning addon={addon} />}
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

              {this.renderDevCommentsCard()}

              {addonType === ADDON_TYPE_EXTENSION && (
                <AddonRecommendations addon={addon} />
              )}
            </div>

            {this.renderRatingsCard()}

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

export function mapStateToProps(state, ownProps) {
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
)(AddonBase);
