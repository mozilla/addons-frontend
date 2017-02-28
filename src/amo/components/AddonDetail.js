/* eslint-disable react/no-danger */
import React, { PropTypes } from 'react';
import { compose } from 'redux';

import AddonMeta from 'amo/components/AddonMeta';
import AddonMoreInfo from 'amo/components/AddonMoreInfo';
import DefaultRatingManager from 'amo/components/RatingManager';
import ScreenShots from 'amo/components/ScreenShots';
import Link from 'amo/components/Link';
import 'amo/css/AddonDetail.scss';
import fallbackIcon from 'amo/img/icons/default-64.png';
import InstallButton from 'core/components/InstallButton';
import { ADDON_TYPE_THEME, ENABLED } from 'core/constants';
import { withInstallHelpers } from 'core/installAddon';
import { isAllowedOrigin, ngettext, nl2br, sanitizeHTML } from 'core/utils';
import translate from 'core/i18n/translate';
import Card from 'ui/components/Card';
import Icon from 'ui/components/Icon';
import ShowMoreCard from 'ui/components/ShowMoreCard';


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

export class AddonDetailBase extends React.Component {
  static propTypes = {
    RatingManager: PropTypes.element,
    addon: PropTypes.object.isRequired,
    getBrowserThemeData: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    isPreviewingTheme: PropTypes.bool.isRequired,
    location: PropTypes.object.isRequired,
    resetThemePreview: PropTypes.func.isRequired,
    themePreviewNode: PropTypes.element,
    status: PropTypes.string.isRequired,
    toggleThemePreview: PropTypes.func.isRequired,
  }

  static defaultProps = {
    RatingManager: DefaultRatingManager,
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

  headerImage() {
    const { addon, getBrowserThemeData, i18n, isPreviewingTheme, status } = this.props;
    const { previewURL, type } = addon;
    const iconUrl = isAllowedOrigin(addon.icon_url) ? addon.icon_url :
      fallbackIcon;

    if (type === ADDON_TYPE_THEME) {
      const label = isPreviewingTheme ? i18n.gettext('Cancel preview') : i18n.gettext('Tap to preview');
      const imageClassName = 'AddonDetail-theme-header-image';
      const headerImage = <img alt={label} className={imageClassName} src={previewURL} />;

      return (
        <div
          className="AddonDetail-theme-header"
          id="AddonDetail-theme-header"
          data-browsertheme={getBrowserThemeData()}
          ref={(el) => { this.wrapper = el; }}
          onClick={this.onClick}
        >
          {status !== ENABLED ?
            <button className="Button AddonDetail-theme-header-label" htmlFor="AddonDetail-theme-header">
              <Icon name="eye" className="AddonDetail-theme-preview-icon" />
              {label}
            </button> : null}
          {headerImage}
        </div>
      );
    }
    return (
      <div className="AddonDetail-icon">
        <img alt="" src={iconUrl} />
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
        ngettext('Read %(count)s review', 'Read all %(count)s reviews', count),
        { count: i18n.formatNumber(count) },
      );

      footerPropName = 'footerLink';
      content = (
        <Link className="AddonDetail-all-reviews-link"
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
        <div className="AddonDetail-read-reviews-footer">{content}</div>),
    };
    return (
      <Card
        header={i18n.gettext('Rate your experience')}
        className="AddonDetail-overall-rating"
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
    const { addon, i18n } = this.props;

    const authorList = addon.authors.map(
      (author) => `<a href="${author.url}">${author.name}</a>`);
    const description = addon.description ? addon.description : addon.summary;
    const descriptionSanitized = sanitizeHTML(
      nl2br(description), allowedDescriptionTags);
    const summarySanitized = sanitizeHTML(
      addon.summary, ['a']);
    const title = i18n.sprintf(
      // L10n: Example: The Add-On <span>by The Author</span>
      i18n.gettext('%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s'), {
        addonName: addon.name,
        authorList: authorList.join(', '),
        startSpan: '<span class="AddonDetail-author">',
        endSpan: '</span>',
      });

    // eslint-disable react/no-danger
    return (
      <div className="AddonDetail">
        <header className="AddonDetail-header">
          {this.headerImage()}
          <div className="AddonDetail-title">
            <h1
              dangerouslySetInnerHTML={sanitizeHTML(title, ['a', 'span'])}
              className="AddonDetail-title-heading" />
          </div>
          <p className="AddonDetail-summary"
            dangerouslySetInnerHTML={summarySanitized} />
        </header>

        <section className="AddonDetail-metadata">
          <h2 className="visually-hidden">
            {i18n.gettext('Extension Metadata')}
          </h2>
          <AddonMeta addon={addon} />
          <InstallButton {...this.props} />
        </section>

        {addon.previews.length > 0
          ? (
            <Card className="AddonDetail-screenshots">
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
    );
    // eslint-enable react/no-danger
  }
}

export default compose(
  translate({ withRef: true }),
  withInstallHelpers({ src: 'dp-btn-primary' }),
)(AddonDetailBase);
