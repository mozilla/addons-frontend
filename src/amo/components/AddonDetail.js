import React, { PropTypes } from 'react';

import AddonMeta from 'amo/components/AddonMeta';
import InstallButton from 'core/components/InstallButton';
import LikeButton from 'amo/components/LikeButton';
import ScreenShots from 'amo/components/ScreenShots';
import SearchBox from 'amo/components/SearchBox';
import translate from 'core/i18n/translate';
import { nl2br, sanitizeHTML } from 'core/utils';


import 'amo/css/AddonDetail.scss';

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
    i18n: PropTypes.object,
    addon: PropTypes.shape({
      name: PropTypes.string.isRequired,
      authors: PropTypes.array.isRequired,
      slug: PropTypes.string.isRequired,
    }),
  }

  render() {
    const { i18n, addon } = this.props;

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

    return (
      <div className="AddonDetail">
        <header>
          <SearchBox />
          <div className="icon">
            <img alt="" />
            <LikeButton />
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
          <h2 className="visually-hidden">{i18n.gettext('Extension Metadata')}</h2>
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
      </div>
    );
  }
}

export default translate({ withRef: true })(AddonDetail);
