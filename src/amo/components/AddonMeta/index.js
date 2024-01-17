/* @flow */
import * as React from 'react';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import Link from 'amo/components/Link';
import { reviewListURL } from 'amo/reducers/reviews';
import translate from 'amo/i18n/translate';
import MetadataCard from 'amo/components/MetadataCard';
import Rating from 'amo/components/Rating';
import RatingsByStar from 'amo/components/RatingsByStar';
import type { AddonType } from 'amo/types/addons';
import type { I18nType } from 'amo/types/i18n';
import type { ReactRouterLocationType } from 'amo/types/router';

import './styles.scss';

type Props = {|
  addon: AddonType | null,
|};

type InternalProps = {|
  ...Props,
  jed: I18nType,
  location: ReactRouterLocationType,
|};

export const roundToOneDigit = (value: number | null): number => {
  return value ? Math.round(value * 10) / 10 : 0;
};

export class AddonMetaBase extends React.Component<InternalProps> {
  render(): React.Node {
    const { addon, jed, location } = this.props;

    let averageRating;
    if (addon) {
      averageRating = addon.ratings ? addon.ratings.average : null;
    }
    const addonRatingCount =
      addon && addon.ratings ? addon.ratings.count : null;
    const averageDailyUsers = addon ? addon.average_daily_users : null;
    const roundedAverage = roundToOneDigit(averageRating || null);

    let userCount: null | string = '';
    let userTitle;
    if (!addon) {
      userCount = null;
      userTitle = jed.gettext('Users');
    } else if (averageDailyUsers) {
      userCount = jed.formatNumber(averageDailyUsers);
      userTitle = jed.ngettext('User', 'Users', averageDailyUsers);
    } else {
      userTitle = jed.gettext('No Users');
    }

    let reviewCount: null | string = '';
    let reviewTitle;
    if (!addon) {
      reviewCount = null;
      reviewTitle = jed.gettext('Reviews');
    } else if (addonRatingCount) {
      reviewCount = jed.formatNumber(addonRatingCount);
      reviewTitle = jed.ngettext('Review', 'Reviews', addonRatingCount);
    } else {
      reviewTitle = jed.gettext('No Reviews');
    }

    const reviewsLink =
      addon && reviewCount
        ? reviewListURL({ addonSlug: addon.slug, location })
        : null;

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
        <h3 className="visually-hidden">{jed.gettext('Used by')}</h3>
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
                    ? jed.sprintf(
                        jed.ngettext(
                          '%(total)s Star',
                          '%(total)s Stars',
                          roundedAverage,
                        ),
                        {
                          total: jed.formatNumber(roundedAverage),
                        },
                      )
                    : jed.gettext('Not rated yet')}
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

const AddonMeta: React.ComponentType<Props> = compose(
  withRouter,
  translate(),
)(AddonMetaBase);

export default AddonMeta;
