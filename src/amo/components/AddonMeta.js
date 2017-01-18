import React, { PropTypes } from 'react';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Icon from 'ui/components/Icon';

import 'amo/css/AddonMeta.scss';

export class AddonMetaBase extends React.Component {
  static propTypes = {
    averageDailyUsers: PropTypes.number.isRequired,
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { averageDailyUsers, i18n } = this.props;

    const userCount = i18n.sprintf(
      i18n.ngettext('%(total)s user', '%(total)s users', averageDailyUsers),
      { total: i18n.formatNumber(averageDailyUsers) },
    );
    return (
      <div className="AddonMeta">
        <div className="AddonMeta-users">
          <h3 className="visually-hidden">{i18n.gettext('Used by')}</h3>
          <Icon className="AddonMeta-users-icon" name="user" />
          <p className="AddonMeta-text">{userCount}</p>
        </div>
      </div>
    );
  }
}

export default compose(
  translate({ withRef: true }),
)(AddonMetaBase);
