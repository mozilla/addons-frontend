/* eslint-disable jsx-a11y/heading-has-content */
import makeClassName from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import Helmet from 'react-helmet';
import { connect } from 'react-redux';

import { setViewContext } from 'amo/actions/viewContext';
import AddonBadges from 'amo/components/AddonBadges';
import AddonsCard from 'amo/components/AddonsCard';
import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import AddonMeta from 'amo/components/AddonMeta';
import AddonMoreInfo from 'amo/components/AddonMoreInfo';
import ContributeCard from 'amo/components/ContributeCard';
import NotFound from 'amo/components/ErrorPage/NotFound';
import DefaultRatingManager from 'amo/components/RatingManager';
import ScreenShots from 'amo/components/ScreenShots';
import Link from 'amo/components/Link';
import { fetchOtherAddonsByAuthors } from 'amo/reducers/addonsByAuthors';
import {
  fetchAddon,
  getAddonByID,
  getAddonBySlug,
} from 'core/reducers/addons';
import { sendServerRedirect } from 'core/reducers/redirectTo';
import { withFixedErrorHandler } from 'core/errorHandler';
import InstallButton from 'core/components/InstallButton';
import {
  ADDON_TYPE_DICT,
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_LANG,
  ADDON_TYPE_OPENSEARCH,
  ADDON_TYPE_THEME,
  ENABLED,
  UNKNOWN,
} from 'core/constants';
import { withInstallHelpers } from 'core/installAddon';
import {
  nl2br,
  sanitizeHTML,
  sanitizeUserHTML,
} from 'core/utils';
import {
  getClientCompatibility as _getClientCompatibility,
} from 'core/utils/compatibility';
import { getAddonIconUrl } from 'core/imageUtils';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import ShowMoreCard from 'ui/components/ShowMoreCard';

import './styles.scss';


export class AddonBase extends React.Component {
  static propTypes = {
    RatingManager: PropTypes.element,
    addon: PropTypes.object.isRequired,
    clientApp: PropTypes.string.isRequired,
    dispatch: PropTypes.func.isRequired,
    errorHandler: PropTypes.object.isRequired,
    getClientCompatibility: PropTypes.func,
    getBrowserThemeData: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    installURLs: PropTypes.object,
    isPreviewingTheme: PropTypes.bool.isRequired,
    lang: PropTypes.string.isRequired,
    location: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    resetThemePreview: PropTypes.func.isRequired,
    // This prop is passed in by withInstallHelpers({ src: '...' })
    src: PropTypes.string.isRequired,
    // eslint-disable-next-line react/require-default-props
    themePreviewNode: PropTypes.element,
    installStatus: PropTypes.string.isRequired,
    toggleThemePreview: PropTypes.func.isRequired,
    userAgentInfo: PropTypes.object.isRequired,
    addonsByAuthors: PropTypes.array.isRequired,
  }

  static defaultProps = {
    RatingManager: DefaultRatingManager,
    installURLs: {},
    getClientCompatibility: _getClientCompatibility,
  }

  componentWillMount() {
    const {
      addon,
      clientApp,
      dispatch,
      errorHandler,
      lang,
      params,
    } = this.props;

    // This makes sure we do not try to dispatch any new actions in the case
    // of an error.
    if (!errorHandler.hasError()) {
      if (addon) {
        // eslint-disable-next-line no-restricted-globals
        if (!isNaN(params.slug)) {
          // We only load add-ons by slug, but ID must be supported too because
          // it is a legacy behavior.
          dispatch(sendServerRedirect({
            status: 301,
            url: `/${lang}/${clientApp}/addon/${addon.slug}/`,
          }));
          return;
        }

        dispatch(setViewContext(addon.type));
        this.dispatchFetchOtherAddonsByAuthors({ addon });
      } else {
        dispatch(fetchAddon({ slug: params.slug, errorHandler }));
      }
    }
  }

  componentWillReceiveProps({ addon: newAddon, params: newParams }) {
    const { addon: oldAddon, dispatch, errorHandler, params } = this.props;

    const oldAddonType = oldAddon ? oldAddon.type : null;
    if (newAddon && newAddon.type !== oldAddonType) {
      dispatch(setViewContext(newAddon.type));
    }

    if (params.slug !== newParams.slug) {
      dispatch(fetchAddon({ slug: newParams.slug, errorHandler }));
    }

    if (newAddon && oldAddon !== newAddon) {
      this.dispatchFetchOtherAddonsByAuthors({ addon: newAddon });
    }
  }

  componentWillUnmount() {
    const {
      isPreviewingTheme,
      resetThemePreview,
      themePreviewNode,
    } = this.props;

    if (isPreviewingTheme && themePreviewNode) {
      resetThemePreview(themePreviewNode);
    }
  }

  onClick = (event) => {
    this.props.toggleThemePreview(event.currentTarget);
  }

  dispatchFetchOtherAddonsByAuthors({ addon }) {
    const { dispatch, errorHandler } = this.props;

    dispatch(fetchOtherAddonsByAuthors({
      addonType: addon.type,
      authors: addon.authors.map((author) => author.username),
      errorHandlerId: errorHandler.id,
      slug: addon.slug,
    }));
  }

  headerImage({ compatible } = {}) {
    const {
      addon,
      getBrowserThemeData,
      i18n,
      isPreviewingTheme,
      installStatus,
    } = this.props;
    const previewURL = addon ? addon.previewURL : null;
    const type = addon ? addon.type : ADDON_TYPE_EXTENSION;
    const iconUrl = getAddonIconUrl(addon);

    if (type === ADDON_TYPE_THEME) {
      const label = isPreviewingTheme ? i18n.gettext('Cancel preview') : i18n.gettext('Tap to preview');
      const imageClassName = 'Addon-theme-header-image';
      const headerImage = <img alt={label} className={imageClassName} src={previewURL} />;

      return (
        <div
          className="Addon-theme-header"
          id="Addon-theme-header"
          data-browsertheme={getBrowserThemeData()}
          onClick={this.onClick}
          role="presentation"
        >
          {installStatus !== ENABLED ? (
            <Button
              className="Addon-theme-header-label Button--action"
              disabled={!compatible}
              htmlFor="Addon-theme-header"
            >
              <Icon name="eye" className="Addon-theme-preview-icon" />
              {label}
            </Button>
          ) : null}
          {headerImage}
        </div>
      );
    }
    return (
      <div className="Addon-icon">
        <img className="Addon-icon-image" alt="" src={iconUrl} />
      </div>
    );
  }

  renderRatingsCard() {
    const { RatingManager, addon, i18n, location } = this.props;
    let content;
    let footerPropName = 'footerText';

    let ratingManager;
    if (addon && addon.current_version) {
      ratingManager = (
        <RatingManager
          addon={addon}
          location={location}
          version={addon.current_version}
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
        i18n.ngettext('Read %(count)s review', 'Read all %(count)s reviews', count),
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
        <div className="Addon-read-reviews-footer">{content}</div>),
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
        case ADDON_TYPE_THEME:
          title = i18n.gettext('About this theme');
          break;
        default:
          title = i18n.gettext('About this add-on');
      }

      const description = addon.description ? addon.description : addon.summary;
      if (!description || !description.length) {
        return null;
      }
      descriptionProps.dangerouslySetInnerHTML = sanitizeUserHTML(description);
    } else {
      title = <LoadingText width={40} />;
      descriptionProps.children = <LoadingText width={100} />;
    }

    return (
      <ShowMoreCard
        header={title}
        className="AddonDescription"
      >
        <div
          className="AddonDescription-contents"
          ref={(ref) => { this.addonDescription = ref; }}
          {...descriptionProps}
        />
      </ShowMoreCard>
    );
  }

  renderVersionReleaseNotes() {
    const { addon, i18n } = this.props;
    if (!addon) {
      return null;
    }

    const currentVersion = addon.current_version;
    if (!currentVersion || !currentVersion.release_notes) {
      return null;
    }

    const header = i18n.sprintf(
      i18n.gettext('Release notes for %(addonVersion)s'),
      { addonVersion: currentVersion.version }
    );
    const releaseNotes = sanitizeUserHTML(currentVersion.release_notes);

    /* eslint-disable react/no-danger */
    return (
      <ShowMoreCard className="AddonDescription-version-notes" header={header}>
        <div dangerouslySetInnerHTML={releaseNotes} />
      </ShowMoreCard>
    );
    /* eslint-enable react/no-danger */
  }

  renderMoreAddonsByAuthors = () => {
    const { addon, addonsByAuthors, i18n } = this.props;

    if (!addon || !addonsByAuthors || addonsByAuthors.length === 0) {
      return null;
    }

    const addonType = addon.type;
    const authorNames = addon.authors.map((author) => author.name);

    let header;
    switch (addonType) {
      case ADDON_TYPE_DICT:
        header = i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More dictionaries by %(author)s'),
            { author: authorNames[0] }
          ),
          i18n.gettext('More dictionaries by these translators'),
          authorNames.length
        );
        break;
      case ADDON_TYPE_EXTENSION:
        header = i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More extensions by %(author)s'),
            { author: authorNames[0] }
          ),
          i18n.gettext('More extensions by these developers'),
          authorNames.length
        );
        break;
      case ADDON_TYPE_LANG:
        header = i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More language packs by %(author)s'),
            { author: authorNames[0] }
          ),
          i18n.gettext('More language packs by these translators'),
          authorNames.length
        );
        break;
      case ADDON_TYPE_THEME:
        header = i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More themes by %(author)s'),
            { author: authorNames[0] }
          ),
          i18n.gettext('More themes by these artists'),
          authorNames.length
        );
        break;
      default:
        header = i18n.ngettext(
          i18n.sprintf(
            i18n.gettext('More add-ons by %(author)s'),
            { author: authorNames[0] }
          ),
          i18n.gettext('More add-ons by these developers'),
          authorNames.length
        );
    }

    const classnames = makeClassName('AddonDescription-more-addons', {
      'AddonDescription-more-addons--theme': addonType === ADDON_TYPE_THEME,
    });

    return (
      <AddonsCard
        addons={addonsByAuthors}
        className={classnames}
        header={header}
        showSummary={false}
        type="horizontal"
      />
    );
  }

  render() {
    const {
      addon,
      addonsByAuthors,
      clientApp,
      errorHandler,
      getClientCompatibility,
      i18n,
      installStatus,
      src,
      userAgentInfo,
    } = this.props;

    let errorBanner = null;
    if (errorHandler.hasError()) {
      log.warn('Captured API Error:', errorHandler.capturedError);

      // 401 and 403 are made to look like a 404 on purpose.
      // See: https://github.com/mozilla/addons-frontend/issues/3061.
      if (errorHandler.capturedError.responseStatusCode === 401 ||
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
        summaryProps.dangerouslySetInnerHTML = sanitizeHTML(
          nl2br(summary), ['a', 'br']);
        showSummary = true;
      }
    } else {
      summaryProps.children = <LoadingText width={100} />;
      showSummary = true;
    }

    const titleProps = {};
    if (addon) {
      const authorList = addon.authors.map((author) => {
        if (author.url) {
          return `<a href="${author.url}">${author.name}</a>`;
        }

        return author.name;
      });
      const title = i18n.sprintf(
        // translators: Example: The Add-On <span>by The Author</span>
        i18n.gettext('%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s'), {
          addonName: addon.name,
          authorList: authorList.join(', '),
          startSpan: '<span class="Addon-author">',
          endSpan: '</span>',
        }
      );
      titleProps.dangerouslySetInnerHTML = sanitizeHTML(title, ['a', 'span']);
    } else {
      titleProps.children = <LoadingText width={70} />;
    }

    const addonPreviews = addon ? addon.previews : [];

    let isCompatible = false;
    let compatibility;
    if (addon) {
      compatibility = getClientCompatibility({
        addon, clientApp, userAgentInfo,
      });
      isCompatible = compatibility.compatible;
    }

    const numberOfAddonsByAuthors = addonsByAuthors ? addonsByAuthors.length : 0;

    return (
      <div
        className={makeClassName('Addon', `Addon-${addonType}`, {
          'Addon--has-more-than-0-addons': numberOfAddonsByAuthors > 0,
          'Addon--has-more-than-3-addons': numberOfAddonsByAuthors > 3,
        })}
        data-site-identifier={addon ? addon.id : null}
      >
        {addon && (
          <Helmet>
            <title>{addon.name}</title>
          </Helmet>
        )}

        {errorBanner}
        <div className="Addon-header-wrapper">
          <Card className="Addon-header-info-card" photonStyle>
            {compatibility && !isCompatible ? (
              <AddonCompatibilityError
                className="Addon-header-compatibility-error"
                maxVersion={compatibility.maxVersion}
                minVersion={compatibility.minVersion}
                reason={compatibility.reason}
              />
            ) : null}
            <header className="Addon-header">
              {this.headerImage({ compatible: isCompatible })}

              <h1 className="Addon-title" {...titleProps} />

              <AddonBadges addon={addon} />

              <div className="Addon-summary-and-install-button-wrapper">
                {showSummary ?
                  <p className="Addon-summary" {...summaryProps} /> : null}

                {addon ?
                  <InstallButton
                    {...this.props}
                    disabled={!isCompatible}
                    ref={(ref) => { this.installButton = ref; }}
                    src={src}
                    status={installStatus}
                    useButton
                  /> : null
                }
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
            {addonType === ADDON_TYPE_THEME ?
              this.renderMoreAddonsByAuthors() : null}

            {addonPreviews.length > 0 ? (
              <Card
                className="Addon-screenshots"
                header={i18n.gettext('Screenshots')}
              >
                <ScreenShots previews={addonPreviews} />
              </Card>
            ) : null}

            {this.renderShowMoreCard()}
          </div>

          {this.renderRatingsCard()}

          <ContributeCard addon={addon} />

          <AddonMoreInfo addon={addon} />

          {this.renderVersionReleaseNotes()}

          {addonType !== ADDON_TYPE_THEME ?
            this.renderMoreAddonsByAuthors() : null}
        </div>
      </div>
    );
    // eslint-enable react/no-danger
  }
}

export function mapStateToProps(state, ownProps) {
  const { slug } = ownProps.params;
  let addon = getAddonBySlug(state, slug);

  // It is possible to load an add-on by its ID but in the routing parameters,
  // the parameter is always named `slug`.
  // eslint-disable-next-line no-restricted-globals
  if (slug && !isNaN(slug)) {
    addon = getAddonByID(state, slug);
  }

  let addonsByAuthors;
  let installedAddon = {};

  if (addon) {
    addonsByAuthors = state.addonsByAuthors.byAddonSlug[addon.slug];
    installedAddon = state.installations[addon.guid] || {};
  }

  return {
    addon,
    // TODO: fix the spreads in https://github.com/mozilla/addons-frontend/issues/1416
    //
    // These spreads obscure a lot of hidden properties but they
    // cannot be deleted until core/reducers/addons, core/installAddon,
    // and maybe others get fixed up, who knows.
    //
    // The withInstallHelpers HOC needs to access properties like id and
    // properties from addon.theme_data (which are spread onto addon) and
    // maybe others.
    ...addon,
    installURLs: addon ? addon.installURLs : {},
    // The withInstallHelpers HOC also needs to access some properties in
    // here like guid and probably others.
    ...installedAddon,
    installStatus: installedAddon.status || UNKNOWN,
    clientApp: state.api.clientApp,
    lang: state.api.lang,
    userAgentInfo: state.api.userAgentInfo,
    addonsByAuthors,
  };
}

export const extractId = (ownProps) => {
  return ownProps.params.slug;
};

export default compose(
  translate({ withRef: true }),
  connect(mapStateToProps),
  withInstallHelpers({ src: 'dp-btn-primary' }),
  withFixedErrorHandler({ fileName: __filename, extractId }),
)(AddonBase);
