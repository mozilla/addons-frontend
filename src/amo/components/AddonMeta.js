import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';

import 'amo/css/AddonMeta.scss';


export class AddonMetaBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { addon, i18n } = this.props;
    const averageRating = addon ? addon.ratings.average : null;
    const addonRatingCount = addon ? addon.ratings.count : false;

    let userCount;
    if (addon) {
      const averageDailyUsers = addon.average_daily_users;
      userCount = i18n.sprintf(
        i18n.ngettext('%(total)s user', '%(total)s users', averageDailyUsers),
        { total: i18n.formatNumber(averageDailyUsers) },
      );
    } else {
      userCount = <LoadingText />;
    }

    let reviewCount;
    if (addonRatingCount) {
      reviewCount = i18n.sprintf(
        i18n.ngettext(
          '%(total)s review', '%(total)s reviews', addonRatingCount),
        { total: i18n.formatNumber(addonRatingCount) },
      );
    } else {
      reviewCount = i18n.gettext('No reviews');
    }

    return (
      <div className="AddonMeta">
        <div className="AddonMeta-item AddonMeta-users">
          <h3 className="visually-hidden">{i18n.gettext('Used by')}</h3>
          <p className="AddonMeta-text AddonMeta-user-count">
            {userCount}
          </p>
          <p className="AddonMeta-text AddonMeta-review-count">
            {reviewCount}
          </p>
          <Rating className="AddonMeta-Rating" rating={averageRating}
            readOnly styleName="small" />
        </div>
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(AddonMetaBase);
