/* eslint-disable react/no-danger */
import React, { PropTypes } from 'react';
import { compose } from 'redux';

import AddonMeta from 'amo/components/AddonMeta';
import AddonMoreInfo from 'amo/components/AddonMoreInfo';
import DefaultOverallRating from 'amo/components/OverallRating';
import ScreenShots from 'amo/components/ScreenShots';
import 'amo/css/AddonDetail.scss';
import fallbackIcon from 'amo/img/icons/default-64.png';
import InstallButton from 'core/components/InstallButton';
import { THEME_TYPE } from 'core/constants';
import { withInstallHelpers } from 'core/installAddon';
import { isAllowedOrigin, nl2br, sanitizeHTML } from 'core/utils';
import translate from 'core/i18n/translate';
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
    OverallRating: PropTypes.element,
    addon: PropTypes.object.isRequired,
    getBrowserThemeData: PropTypes.func.isRequired,
    i18n: PropTypes.object.isRequired,
    previewTheme: PropTypes.func.isRequired,
    resetPreviewTheme: PropTypes.func.isRequired,
  }

  static defaultProps = {
    OverallRating: DefaultOverallRating,
  }

  onTouchStart = (event) => {
    // We preventDefault so that the image long-press menu doesn't appear.
    // This unfortunately prevents scrolling :(
    event.preventDefault();
    this.props.previewTheme(event.currentTarget);
  }

  onTouchEnd = (event) => {
    this.props.resetPreviewTheme(event.currentTarget);
  }

  headerImage() {
    const { addon, getBrowserThemeData, i18n } = this.props;
    const { previewURL, type } = addon;
    const iconUrl = isAllowedOrigin(addon.icon_url) ? addon.icon_url :
      fallbackIcon;

    if (type === THEME_TYPE) {
      const label = i18n.gettext('Press to preview');
      return (
        <div
          className="AddonDetail-theme-header"
          id="AddonDetail-theme-header"
          data-browsertheme={getBrowserThemeData()}
          onTouchStart={this.onTouchStart}
          onTouchEnd={this.onTouchEnd}
        >
          <label className="AddonDetail-theme-header-label" htmlFor="AddonDetail-theme-header">
            <Icon name="eye" className="AddonDetail-theme-preview-icon" />
            {label}
          </label>
          <img
            alt={label}
            className="AddonDetail-theme-header-image"
            src={previewURL} />
        </div>
      );
    }
    return (
      <div className="AddonDetail-icon">
        <img alt="" src={iconUrl} />
      </div>
    );
  }

  render() {
    const { OverallRating, addon, i18n } = this.props;

    const authorList = addon.authors.map(
      (author) => `<a href="${author.url}">${author.name}</a>`);

    const title = i18n.sprintf(
      // L10n: Example: The Add-On <span>by The Author</span>
      i18n.gettext('%(addonName)s %(startSpan)sby %(authorList)s%(endSpan)s'), {
        addonName: addon.name,
        authorList: authorList.join(', '),
        startSpan: '<span class="author">',
        endSpan: '</span>',
      });

    // eslint-disable react/no-danger
    return (
      <div className="AddonDetail">
        <header className="AddonDetail-header">
          {this.headerImage()}
          <div className="title">
            <h1 dangerouslySetInnerHTML={sanitizeHTML(title, ['a', 'span'])} />
            <InstallButton {...this.props} />
          </div>
          <p className="AddonDetail-summary"
            dangerouslySetInnerHTML={sanitizeHTML(addon.summary)} />
        </header>

        <section className="addon-metadata">
          <h2 className="visually-hidden">
            {i18n.gettext('Extension Metadata')}
          </h2>
          <AddonMeta />
        </section>

        <hr />

        <section className="screenshots">
          <h2>{i18n.gettext('Screenshots')}</h2>
          <ScreenShots />
        </section>

        <hr />

        <ShowMoreCard header={i18n.sprintf(
          i18n.gettext('About this %(addonType)s'), { addonType: addon.type }
        )} className="AddonDescription">
          <div className="AddonDescription-contents"
            ref={(ref) => { this.addonDescription = ref; }}
            dangerouslySetInnerHTML={
              sanitizeHTML(nl2br(addon.description), allowedDescriptionTags)
            } />
        </ShowMoreCard>

        <section className="overall-rating">
          <h2>{i18n.gettext('Rate your experience')}</h2>
          <OverallRating
            addon={addon}
            version={addon.current_version}
          />
        </section>

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
