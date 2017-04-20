import React, { PropTypes } from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Rating from 'ui/components/Rating';

import 'amo/css/AddonMeta.scss';


export class AddonMetaBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { addon, i18n } = this.props;
    const averageDailyUsers = addon.average_daily_users;
    const averageRating = addon.ratings.average;
    const addonRatingCount = addon.ratings.count;

    const userCount = i18n.sprintf(
      i18n.ngettext('%(total)s user', '%(total)s users', averageDailyUsers),
      { total: i18n.formatNumber(averageDailyUsers) },
    );

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
          <p className="AddonMeta-text">{userCount}</p>
          <Rating className="AddonMeta-Rating" rating={averageRating} readOnly
            styleName="small-monochrome" />
          <p className="AddonMeta-text AddonMeta-review-count">{reviewCount}</p>
        </div>
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(AddonMetaBase);
