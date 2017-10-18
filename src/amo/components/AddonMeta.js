/* @flow */
import React from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import Link from 'amo/components/Link';
import translate from 'core/i18n/translate';
import { isAddonAuthor } from 'core/utils';
import type { AddonType } from 'core/types/addons';
import LoadingText from 'ui/components/LoadingText';
import Rating from 'ui/components/Rating';
import type { I18nType } from 'core/types/i18n';

import 'amo/css/AddonMeta.scss';


type Props = {|
  addon: AddonType | null,
  i18n: I18nType,
  userId: number | null,
|};

export class AddonMetaBase extends React.Component<Props> {
  render() {
    const { addon, i18n, userId } = this.props;
    const averageRating = addon && addon.ratings ? addon.ratings.average : null;
    const addonRatingCount = addon && addon.ratings ?
      addon.ratings.count : null;

    let userCount;
    if (addon) {
      const averageDailyUsers = addon.average_daily_users;
      userCount = i18n.sprintf(
        i18n.ngettext('%(total)s user', '%(total)s users', averageDailyUsers),
        { total: i18n.formatNumber(averageDailyUsers) },
      );
    } else {
      userCount = <LoadingText width={100} />;
    }

    let reviewCount;
    if (!addon) {
      reviewCount = <LoadingText />;
    } else if (addonRatingCount) {
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
            {addon && isAddonAuthor({ addon, userId }) ? (
              <Link
                href={`/addon/${addon.slug}/statistics/`}
                title={i18n.gettext('Click to view statistics')}
              >
                {userCount}
              </Link>
            ) : userCount}
          </p>
          <p className="AddonMeta-text AddonMeta-review-count">
            {reviewCount}
          </p>
          <Rating
            className="AddonMeta-Rating"
            rating={averageRating}
            readOnly
            styleName="small"
          />
        </div>
      </div>
    );
  }
}

export const mapStateToProps = (state: Object) => {
  return {
    userId: state.user.id,
  };
};

export default compose(
  connect(mapStateToProps),
  translate(),
)(AddonMetaBase);
