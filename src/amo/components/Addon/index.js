/* eslint-disable react/no-danger */
import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { connect } from 'react-redux';

import AddonCompatibilityError from 'amo/components/AddonCompatibilityError';
import AddonMeta from 'amo/components/AddonMeta';
import AddonMoreInfo from 'amo/components/AddonMoreInfo';
import DefaultRatingManager from 'amo/components/RatingManager';
import ScreenShots from 'amo/components/ScreenShots';
import Link from 'amo/components/Link';
import fallbackIcon from 'amo/img/icons/default-64.png';
import InstallButton from 'core/components/InstallButton';
import { ADDON_TYPE_THEME, ENABLED, UNKNOWN } from 'core/constants';
import { withInstallHelpers } from 'core/installAddon';
import {
  isAllowedOrigin,
  getClientCompatibility as _getClientCompatibility,
  loadAddonIfNeeded,
  nl2br,
  safeAsyncConnect,
  sanitizeHTML,
} from 'core/utils';
import translate from 'core/i18n/translate';
import Button from 'ui/components/Button';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';
import ShowMoreCard from 'ui/components/ShowMoreCard';

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
    getClientCompatibility: PropTypes.func,
    getBrowserThemeData: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    isPreviewingTheme: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    resetThemePreview: PropTypes.func.isRequired,
    themePreviewNode: PropTypes.element,
    installStatus: PropTypes.string.isRequired,
    toggleThemePreview: PropTypes.func.isRequired,
    userAgentInfo: PropTypes.object.isRequired,
  }

  static defaultProps = {
    RatingManager: DefaultRatingManager,
    getClientCompatibility: _getClientCompatibility,
  }

  componentWillUnmount() {
    const { isPreviewingTheme, resetThemePreview, themePreviewNode } = this.props;
    if (isPreviewingTheme && themePreviewNode) {
      resetThemePreview(themePreviewNode);
    }
  }

  onClick = (event) => {
    this.props.toggleThemePreview(event.currentTarget);
  }

  headerImage({ compatible } = {}) {
    const {
      addon,
      getBrowserThemeData,
      i18n,
      isPreviewingTheme,
      installStatus,
    } = this.props;
    const { previewURL, type } = addon;
    const iconUrl = isAllowedOrigin(addon.icon_url) ? addon.icon_url :
      fallbackIcon;

    if (type === ADDON_TYPE_THEME) {
      const label = isPreviewingTheme ? i18n.gettext('Cancel preview') : i18n.gettext('Tap to preview');
      const imageClassName = 'Addon-theme-header-image';
      const headerImage = <img alt={label} className={imageClassName} src={previewURL} />;

      return (
        <div
          className="Addon-theme-header"
          id="Addon-theme-header"
          data-browsertheme={getBrowserThemeData()}
          ref={(el) => { this.wrapper = el; }}
          onClick={this.onClick}
        >
          {installStatus !== ENABLED ? (
            <Button
              className="Addon-theme-header-label Button--neutral"
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
    let footerPropName;

    if (addon.ratings.count) {
      const count = addon.ratings.count;
      const linkText = i18n.sprintf(
        i18n.ngettext('Read %(count)s review', 'Read all %(count)s reviews', count),
        { count: i18n.formatNumber(count) },
      );

      footerPropName = 'footerLink';
      content = (
        <Link className="Addon-all-reviews-link"
          to={`/addon/${addon.slug}/reviews/`}>
          {linkText}
        </Link>
      );
    } else {
      footerPropName = 'footerText';
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
        {...props}>
        <RatingManager
          addon={addon}
          location={location}
          version={addon.current_version}
        />
      </Card>
    );
  }

  render() {
    const {
      addon,
      clientApp,
      getClientCompatibility,
      i18n,
      installStatus,
      userAgentInfo,
    } = this.props;

    const authorList = addon.authors.map(
      (author) => `<a href="${author.url}">${author.name}</a>`);
    const description = addon.description ? addon.description : addon.summary;
    const descriptionSanitized = sanitizeHTML(
      nl2br(description), allowedDescriptionTags);
    const summarySanitized = sanitizeHTML(addon.summary, ['a']);
    const title = i18n.sprintf(
      // L10n: Example: The Add-On <span>by The Author</span>
      i18n.gettext('%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s'), {
        addonName: addon.name,
        authorList: authorList.join(', '),
        startSpan: '<span class="Addon-author">',
        endSpan: '</span>',
      });

    const {
      compatible, maxVersion, minVersion, reason,
    } = getClientCompatibility({ addon, clientApp, userAgentInfo });

    // eslint-disable react/no-danger
    return (
      <div className="Addon">
        <Card className="" photonStyle>
          <header className="Addon-header">
            <section className="Addon-title-section">
              <h1
                className="Addon-title"
                dangerouslySetInnerHTML={sanitizeHTML(title, ['a', 'span'])}
              />

              <p className="Addon-summary"
                dangerouslySetInnerHTML={summarySanitized} />

              <InstallButton
                {...this.props}
                className="Button--action Button--small"
                disabled={!compatible}
                ref={(ref) => { this.installButton = ref; }}
                status={installStatus}
              />
            </section>

            <section className="Addon-metadata">
              {this.headerImage({ compatible })}

              <h2 className="visually-hidden">
                {i18n.gettext('Extension Metadata')}
              </h2>
              <AddonMeta addon={addon} />
            </section>
          </header>

          {!compatible ? (
            <AddonCompatibilityError maxVersion={maxVersion}
              minVersion={minVersion} reason={reason} />
          ) : null}
        </Card>

        <div className="Addon-details">
          {addon.previews.length > 0 ? (
            <Card
              className="Addon-screenshots"
              header={i18n.gettext('Screenshots')}
            >
              <ScreenShots previews={addon.previews} />
            </Card>
          ) : null}

          <ShowMoreCard header={i18n.sprintf(
            i18n.gettext('About this %(addonType)s'), { addonType: addon.type }
          )} className="AddonDescription">
            <div className="AddonDescription-contents"
              ref={(ref) => { this.addonDescription = ref; }}
              dangerouslySetInnerHTML={descriptionSanitized} />
          </ShowMoreCard>

          {this.renderRatingsCard()}

          <AddonMoreInfo addon={addon} />
        </div>
      </div>
    );
    // eslint-enable react/no-danger
  }
}

export function mapStateToProps(state, ownProps) {
  const { slug } = ownProps.params;
  const addon = state.addons[slug];
  const installedAddon = state.installations[addon.guid] || {};

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
  safeAsyncConnect([{
    key: 'Addon',
    promise: loadAddonIfNeeded,
  }]),
  translate({ withRef: true }),
  connect(mapStateToProps),
  withInstallHelpers({ src: 'dp-btn-primary' }),
)(AddonBase);
