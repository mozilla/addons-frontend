import React, { PropTypes } from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Icon from 'ui/components/Icon';

import 'amo/css/AddonMeta.scss';

export class AddonMetaBase extends React.Component {
  static propTypes = {
    addon: PropTypes.object.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { addon, i18n } = this.props;
    const averageDailyUsers = addon.average_daily_users;

    const userCount = i18n.sprintf(
      i18n.ngettext('%(total)s user', '%(total)s users', averageDailyUsers),
      { total: i18n.formatNumber(averageDailyUsers) },
    );
    return (
      <div className="AddonMeta">
        <div className="AddonMeta-item AddonMeta-users">
          <h3 className="visually-hidden">{i18n.gettext('Used by')}</h3>
          <Icon className="AddonMeta-users-icon" name="user" />
          <p className="AddonMeta-text">{userCount}</p>
        </div>
        <div className="AddonMeta-item">
          <Icon className="AddonMeta-ratings" name="star" />
          <p className="AddonMeta-text">4.2 stars</p>
          <p className="AddonMeta-text">1,000 reviews</p>
        </div>
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(AddonMetaBase);
