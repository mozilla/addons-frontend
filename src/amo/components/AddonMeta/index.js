/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import type { AddonType } from 'core/types/addons';
import MetadataCard from 'ui/components/MetadataCard';
import Rating from 'ui/components/Rating';
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
    const reviewUrl = addon && addon.slug ? `/addon/${addon.slug}/reviews` : '/';
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

    return (
      <div className="AddonMeta">
        <h3 className="visually-hidden">{i18n.gettext('Used by')}</h3>
        <Link
          to={reviewUrl}
          style={{
            all: 'unset',
            cursor: 'pointer',
          }}
        >
          <MetadataCard
            metadata={[
            {
              content: userCount,
              title: userTitle,
            },
            {
              content: reviewCount,
              title: reviewTitle,
            },
            {
              content: (
                <Rating
                  className="AddonMeta-item-header"
                  rating={averageRating}
                  readOnly
                  styleSize="small"
                />
              ),
              title: i18n.gettext('Overall Rating'),
            },
          ]}
          />
        </Link>
      </div>
    );
  }
}

export default compose(
  translate(),
)(AddonMetaBase);
