/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import type { AddonType } from 'core/types/addons';
import MetadataCard from 'ui/components/MetadataCard';
import type { I18nType } from 'core/types/i18n';
import Link from 'amo/components/Link';

import './styles.scss';


type Props = {|
  addon: AddonType | null,
  i18n: I18nType,
|};

export class AddonMetaBase extends React.Component<Props> {
  render() {
    const { addon, i18n } = this.props;
    const averageRating = addon && addon.ratings ? addon.ratings.average : null;
    const addonRatingCount = addon && addon.ratings ?
      addon.ratings.count : null;
    const averageDailyUsers = addon ? addon.average_daily_users : null;

    let userCount = '';
    let userTitle;
    if (!addon) {
      userCount = null;
      userTitle = i18n.gettext('Users');
    } else if (averageDailyUsers) {
      userCount = i18n.formatNumber(averageDailyUsers);
      userTitle = i18n.ngettext('User', 'Users', averageDailyUsers);
    } else {
      userTitle = i18n.gettext('No Users');
    }

    let reviewCount = '';
    let reviewTitle;
    if (!addon) {
      reviewCount = null;
      reviewTitle = i18n.gettext('Ratings');
    } else if (addonRatingCount) {
      reviewCount = i18n.formatNumber(addonRatingCount);
      reviewTitle = i18n.ngettext('Rating', 'Ratings', addonRatingCount);
    } else {
      reviewTitle = i18n.gettext('No Ratings');
    }
    const overallRating = i18n.gettext('Overall Rating');

    const makeLink = (content) => {
      if (addon) {
        return (
          <Link
            className="Addon-all-reviews-link"
            to={`/addon/${addon.slug}/reviews/`}
          >
            {content}
          </Link>
        );
      }
      return content;
    };

    return (
      <div className="AddonMeta">
        <h3 className="visually-hidden">{i18n.gettext('Used by')}</h3>
        <MetadataCard
          metadata={[
            {
              content: userCount,
              title: userTitle,
            },
            {
              content: makeLink(reviewCount),
              title: makeLink(reviewTitle),
            },
            {
              content: makeLink(averageRating),
              title: makeLink(overallRating),
            },
          ]}
        />
      </div>
    );
  }
}

export default compose(
  translate(),
)(AddonMetaBase);
