import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { compose } from 'redux';

import translate from 'core/i18n/translate';
import Icon from 'ui/components/Icon';

import 'amo/css/AddonMeta.scss';

export class AddonMetaBase extends React.Component {
  static propTypes = {
    averageDailyUsers: PropTypes.number.isRequired,
    i18n: PropTypes.object.isRequired,
    lang: PropTypes.string.isRequired,
  }

  render() {
    const { lang, averageDailyUsers, i18n } = this.props;

    const userCount = i18n.sprintf(
      i18n.ngettext('%(total)s user', '%(total)s users', averageDailyUsers),
      { total: averageDailyUsers.toLocaleString(lang) },
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

const mapStateToProps = (state) => ({ lang: state.api.lang });

export default compose(
  connect(mapStateToProps),
  translate({ withRef: true }),
)(AddonMetaBase);
