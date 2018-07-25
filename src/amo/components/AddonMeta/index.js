/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import type { AddonType } from 'core/types/addons';
import MetadataCard from 'ui/components/MetadataCard';
import Rating from 'ui/components/Rating';
import RatingsByStar from 'amo/components/RatingsByStar';
import type { I18nType } from 'core/types/i18n';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
|};

type InternalProps = {|
  ...Props,
  i18n: I18nType,
|};

export class AddonMetaBase extends React.Component<InternalProps> {
  render() {
    const { addon, i18n } = this.props;
    const averageRating = addon && addon.ratings ? addon.ratings.average : null;
    const addonRatingCount =
      addon && addon.ratings ? addon.ratings.count : null;
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

    return (
      <div className="AddonMeta">
        <h3 className="visually-hidden">{i18n.gettext('Used by')}</h3>
        <MetadataCard
          className="AddonMeta-overallRating"
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
                <div className="AddonMeta-rating-content">
                  <Rating
                    rating={averageRating}
                    readOnly
                    styleSize="small"
                    yellowStars
                  />
                </div>
              ),
              title: (
                <div className="AddonMeta-rating-title">
                  {i18n.sprintf(i18n.gettext('%(rating)s star rating'), {
                    rating: i18n.formatNumber(
                      parseFloat(averageRating).toFixed(1),
                    ),
                  })}
                </div>
              ),
            },
          ]}
        />
        <RatingsByStar addon={addon} />
      </div>
    );
  }
}

const AddonMeta: React.ComponentType<Props> = compose(translate())(
  AddonMetaBase,
);

export default AddonMeta;
