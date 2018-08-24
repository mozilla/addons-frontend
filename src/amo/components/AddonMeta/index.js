/* @flow */
import * as React from 'react';
import { compose } from 'redux';

import Link from 'amo/components/Link';
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

export const roundToOneDigit = (value: number | null): number => {
  return value ? Math.round(value * 10) / 10 : 0;
};

export class AddonMetaBase extends React.Component<InternalProps> {
  render() {
    const { addon, i18n } = this.props;
    const averageRating = addon && addon.ratings ? addon.ratings.average : null;
    const addonRatingCount =
      addon && addon.ratings ? addon.ratings.count : null;
    const addonReviewCount =
      addon && addon.ratings ? addon.ratings.text_count : null;
    const averageDailyUsers = addon ? addon.average_daily_users : null;
    const roundedAverage = roundToOneDigit(averageRating);

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
      reviewTitle = i18n.gettext('Reviews');
    } else if (addonReviewCount) {
      reviewCount = i18n.formatNumber(addonReviewCount);
      reviewTitle = i18n.ngettext('Review', 'Reviews', addonReviewCount);
    } else {
      reviewTitle = i18n.gettext('No Reviews');
    }

    const reviewsLink =
      addon && reviewCount ? `/addon/${addon.slug}/reviews/` : null;

    const reviewsContent = reviewsLink ? (
      <Link className="AddonMeta-reviews-content-link" to={reviewsLink}>
        {reviewCount}
      </Link>
    ) : (
      reviewCount
    );

    const reviewsTitle = reviewsLink ? (
      <Link className="AddonMeta-reviews-title-link" to={reviewsLink}>
        {reviewTitle}
      </Link>
    ) : (
      reviewTitle
    );

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
              content: reviewsContent,
              title: reviewsTitle,
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
                  {addonRatingCount
                    ? i18n.sprintf(
                        i18n.ngettext(
                          '%(total)s Star',
                          '%(total)s Stars',
                          roundedAverage,
                        ),
                        {
                          total: i18n.formatNumber(roundedAverage),
                        },
                      )
                    : i18n.gettext('Not rated yet')}
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
