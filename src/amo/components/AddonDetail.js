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
import { ADDON_TYPE_THEME } from 'core/constants';
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
    previewTheme: PropTypes.func.isRequired,
    resetPreviewTheme: PropTypes.func.isRequired,
  }

  static defaultProps = {
    RatingManager: DefaultRatingManager,
  }

  constructor(props) {
    super(props);
    this.state = { mounted: false };
  }

  componentDidMount() {
    // Disabling react/no-did-mount-set-state because it is to prevent additional renders, but
    // that's exactly what we want in this case. We want to render an img tag on the server since
    // we can't use inline styles there, but use an inline background-image in JS to prevent the
    // context menu you get from long pressing on an image.
    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState({ mounted: true });
  }

  onTouchStart = (event) => {
    this.props.previewTheme(event.currentTarget);
  }

  onTouchEnd = (event) => {
    this.props.resetPreviewTheme(event.currentTarget);
  }

  headerImage() {
    const { addon, getBrowserThemeData, i18n } = this.props;
    const { previewURL, type } = addon;
    const { mounted } = this.state;
    const iconUrl = isAllowedOrigin(addon.icon_url) ? addon.icon_url :
      fallbackIcon;

    if (type === ADDON_TYPE_THEME) {
      const label = i18n.gettext('Press to preview');
      const imageClassName = 'AddonDetail-theme-header-image';
      let headerImage;

      if (mounted) {
        const style = { backgroundImage: `url(${previewURL})` };
        headerImage = <div style={style} className={imageClassName} />;
      } else {
        headerImage = <img alt={label} className={imageClassName} src={previewURL} />;
      }

      return (
        <div
          className="AddonDetail-theme-header"
          id="AddonDetail-theme-header"
          data-browsertheme={getBrowserThemeData()}
          onTouchStart={this.onTouchStart}
          onTouchEnd={this.onTouchEnd}
          ref={(el) => { this.wrapper = el; }}
        >
          <label className="AddonDetail-theme-header-label" htmlFor="AddonDetail-theme-header">
            <Icon name="eye" className="AddonDetail-theme-preview-icon" />
            {label}
          </label>
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

  readReviewsFooter() {
    const { addon, i18n } = this.props;
    let content;

    if (addon.ratings.count) {
      const count = addon.ratings.count;
      const linkText = i18n.sprintf(
        // TODO: localize the review count? Or YAGNI?
        ngettext('Read %(count)s review', 'Read %(count)s reviews', count),
        { count },
      );

      content = (
        <Link className="AddonDetail-all-reviews-link"
          to={`/addon/${addon.slug}/reviews/`}>
          {linkText}
        </Link>
      );
    } else {
      content = <span>{i18n.gettext('No reviews yet')}</span>;
    }

    return <div className="AddonDetail-read-reviews-footer">{content}</div>;
  }

  render() {
    const { RatingManager, addon, i18n } = this.props;

    const authorList = addon.authors.map(
      (author) => `<a href="${author.url}">${author.name}</a>`);

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
            dangerouslySetInnerHTML={sanitizeHTML(addon.summary)} />
        </header>

        <section className="AddonDetail-metadata">
          <h2 className="visually-hidden">
            {i18n.gettext('Extension Metadata')}
          </h2>
          <AddonMeta averageDailyUsers={addon.average_daily_users} />
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
            dangerouslySetInnerHTML={
              sanitizeHTML(nl2br(addon.description), allowedDescriptionTags)
            } />
        </ShowMoreCard>

        <Card
          header={i18n.gettext('Rate your experience')}
          footer={this.readReviewsFooter()}
          className="AddonDetail-overall-rating">
          <RatingManager
            addon={addon}
            version={addon.current_version}
          />
        </Card>

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
