/* eslint-disable react/no-danger */
import React, { PropTypes } from 'react';

import AddonMeta from 'amo/components/AddonMeta';
import AddonMoreInfo from 'amo/components/AddonMoreInfo';
import InstallButton from 'core/components/InstallButton';
import DefaultOverallRating from 'amo/components/OverallRating';
import ScreenShots from 'amo/components/ScreenShots';
import translate from 'core/i18n/translate';
import { isAllowedOrigin, nl2br, sanitizeHTML } from 'core/utils';
import 'amo/css/AddonDetail.scss';
import fallbackIcon from 'amo/img/icons/default-64.png';


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

class AddonDetail extends React.Component {
  static propTypes = {
    OverallRating: PropTypes.element,
    addon: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  static defaultProps = {
    OverallRating: DefaultOverallRating,
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

    const iconUrl = isAllowedOrigin(addon.icon_url) ? addon.icon_url :
      fallbackIcon;

    return (
      <div className="AddonDetail">
        <header>
          <div className="icon">
            <img alt="" src={iconUrl} />
          </div>
          <div className="title">
            <h1 dangerouslySetInnerHTML={sanitizeHTML(title, ['a', 'span'])} />
            <InstallButton slug={addon.slug} />
          </div>
          <div className="description">
            <p dangerouslySetInnerHTML={sanitizeHTML(addon.summary)} />
          </div>
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

        <section className="about">
          <h2>{i18n.gettext('About this extension')}</h2>
          <div dangerouslySetInnerHTML={sanitizeHTML(nl2br(addon.description),
                                                     allowedDescriptionTags)} />
        </section>

        <hr />

        <section className="overall-rating">
          <h2>{i18n.gettext('Rate your experience')}</h2>
          <OverallRating
            addonName={addon.name}
            addonId={addon.id}
            addonSlug={addon.slug}
            version={addon.current_version}
          />
        </section>

        <AddonMoreInfo addon={addon} />
      </div>
    );
  }
}

export default translate({ withRef: true })(AddonDetail);
