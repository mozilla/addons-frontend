/* eslint-disable jsx-a11y/heading-has-content */
import classNames from 'classnames';
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { setViewContext } from 'amo/actions/viewContext';
import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import AddonMeta from 'amo/components/AddonMeta';
import AddonMoreInfo from 'amo/components/AddonMoreInfo';
import NotFound from 'amo/components/ErrorPage/NotFound';
import DefaultRatingManager from 'amo/components/RatingManager';
import ScreenShots from 'amo/components/ScreenShots';
import Link from 'amo/components/Link';
import { fetchAddon } from 'core/reducers/addons';
import { withErrorHandler } from 'core/errorHandler';
import InstallButton from 'core/components/InstallButton';
import {
  ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME, ENABLED, UNKNOWN,
} from 'core/constants';
import { withInstallHelpers } from 'core/installAddon';
import {
  getClientCompatibility as _getClientCompatibility,
  nl2br,
  sanitizeHTML,
} from 'core/utils';
import { getAddonIconUrl } from 'core/imageUtils';
import translate from 'core/i18n/translate';
import log from 'core/logger';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';
import LoadingText from 'ui/components/LoadingText';
import ShowMoreCard from 'ui/components/ShowMoreCard';
import Badge from 'ui/components/Badge';

import './styles.scss';


export const allowedDescriptionTags = [
  'a',
  'abbr',
  'acronym',
  'b',
  'blockquote',
  'br',
  'code',
  'em',
  'i',
  'li',
  'ol',
  'strong',
  'ul',
];

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
    isPreviewingTheme: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    resetThemePreview: PropTypes.func.isRequired,
    // eslint-disable-next-line react/require-default-props
    themePreviewNode: PropTypes.element,
    installStatus: PropTypes.string.isRequired,
    toggleThemePreview: PropTypes.func.isRequired,
    userAgentInfo: PropTypes.object.isRequired,
  }

  static defaultProps = {
    RatingManager: DefaultRatingManager,
    getClientCompatibility: _getClientCompatibility,
  }

  componentWillMount() {
    const { addon, dispatch, errorHandler, params } = this.props;

    if (addon) {
      dispatch(setViewContext(addon.type));
    } else {
      dispatch(fetchAddon({ slug: params.slug, errorHandler }));
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

  getFeaturedText(addonType) {
    const { i18n } = this.props;

    switch (addonType) {
      case ADDON_TYPE_EXTENSION:
        return i18n.gettext('Featured Extension');
      case ADDON_TYPE_THEME:
        return i18n.gettext('Featured Theme');
      default:
        return i18n.gettext('Featured Add-on');
    }
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

    if (addon && addon.ratings.count) {
      const count = addon.ratings.count;
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
        {addon ?
          <RatingManager
            addon={addon}
            location={location}
            version={addon.current_version}
          /> : null
        }
      </Card>
    );
  }

  renderShowMoreCard() {
    const { addon, i18n } = this.props;
    const addonType = addon ? addon.type : ADDON_TYPE_EXTENSION;

    const descriptionProps = {};
    if (addon) {
      const description =
        addon.description ? addon.description : addon.summary;
      if (!description || !description.length) {
        return null;
      }
      descriptionProps.dangerouslySetInnerHTML = sanitizeHTML(
        nl2br(description), allowedDescriptionTags);
    } else {
      descriptionProps.children = <LoadingText width={100} />;
    }

    return (
      <ShowMoreCard
        header={i18n.sprintf(i18n.gettext('About this %(addonType)s'), { addonType })}
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

  render() {
    const {
      addon,
      clientApp,
      errorHandler,
      getClientCompatibility,
      i18n,
      installStatus,
      userAgentInfo,
    } = this.props;

    let errorBanner = null;
    if (errorHandler.hasError()) {
      log.error('Captured API Error:', errorHandler.capturedError);
      if (errorHandler.capturedError.responseStatusCode === 404) {
        return <NotFound />;
      }
      // Show a list of errors at the top of the add-on section.
      errorBanner = errorHandler.renderError();
    }

    const addonType = addon ? addon.type : ADDON_TYPE_EXTENSION;

    const summaryProps = {};
    if (addon) {
      // Themes lack a summary so we do the inverse :-/
      // TODO: We should file an API bug about this...
      const summary = addon.summary ? addon.summary : addon.description;
      summaryProps.dangerouslySetInnerHTML = sanitizeHTML(summary, ['a']);
    } else {
      summaryProps.children = <LoadingText width={100} />;
    }

    const titleProps = {};
    if (addon) {
      const authorList = addon.authors.map(
        (author) => `<a href="${author.url}">${author.name}</a>`);
      const title = i18n.sprintf(
        // L10n: Example: The Add-On <span>by The Author</span>
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
    let isFeatured = false;
    let isRestartRequired = false;
    let compatibility;
    if (addon) {
      compatibility = getClientCompatibility({
        addon, clientApp, userAgentInfo,
      });
      isCompatible = compatibility.compatible;
      isFeatured = addon.is_featured;
      isRestartRequired = addon.isRestartRequired;
    }

    return (
      <div className={classNames('Addon', `Addon-${addonType}`)}>
        {errorBanner}
        <Card className="" photonStyle>
          <header className="Addon-header">
            <h1 className="Addon-title" {...titleProps} />
            <p className="Addon-summary" {...summaryProps} />

            <div className="Addon-badges">
              {isFeatured ? (
                <Badge
                  type="featured"
                  label={this.getFeaturedText(addonType)}
                />
              ) : null}
              {isRestartRequired ? (
                <Badge
                  type="restart-required"
                  label={i18n.gettext('Restart Required')}
                />
              ) : null}
            </div>

            {addon ?
              <InstallButton
                {...this.props}
                className="Button--action Button--small"
                disabled={!isCompatible}
                ref={(ref) => { this.installButton = ref; }}
                status={installStatus}
              /> : null
            }

            {this.headerImage({ compatible: isCompatible })}

            <h2 className="visually-hidden">
              {i18n.gettext('Extension Metadata')}
            </h2>

            <AddonMeta addon={addon} />
          </header>

          {compatibility && !isCompatible ? (
            <AddonCompatibilityError
              maxVersion={compatibility.maxVersion}
              minVersion={compatibility.minVersion}
              reason={compatibility.reason}
            />
          ) : null}
        </Card>

        <div className="Addon-details">
          {addonPreviews.length > 0 ? (
            <Card
              className="Addon-screenshots"
              header={i18n.gettext('Screenshots')}
            >
              <ScreenShots previews={addonPreviews} />
            </Card>
          ) : null}

          {this.renderShowMoreCard()}
          {this.renderRatingsCard()}

          {addon ? <AddonMoreInfo addon={addon} /> : null}
        </div>
      </div>
    );
    // eslint-enable react/no-danger
  }
}

export function mapStateToProps(state, ownProps) {
  const { slug } = ownProps.params;
  const addon = state.addons[slug];
  let installedAddon = {};
  if (addon) {
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
    // The withInstallHelpers HOC also needs to access some properties in
    // here like guid and probably others.
    ...installedAddon,
    installStatus: installedAddon.status || UNKNOWN,
    clientApp: state.api.clientApp,
    userAgentInfo: state.api.userAgentInfo,
  };
}

export default compose(
  translate({ withRef: true }),
  connect(mapStateToProps),
  withInstallHelpers({ src: 'dp-btn-primary' }),
  withErrorHandler({ name: 'Addon' }),
)(AddonBase);
