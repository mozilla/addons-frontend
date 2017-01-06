import React, { PropTypes } from 'react';

import translate from 'core/i18n/translate';
import Icon from 'ui/components/Icon';

import 'amo/css/AddonMeta.scss';

export class AddonMetaBase extends React.Component {
  static propTypes = {
    i18n: PropTypes.object.isRequired,
  }

  render() {
    const { i18n } = this.props;

    // This is just a placeholder.
    return (
      <div className="AddonMeta">
        <div className="AddonMeta-users">
          <h3 className="visually-hidden">{i18n.gettext('Used by')}</h3>
          <Icon className="AddonMeta-users-icon" name="user" />
          <p className="AddonMeta-text">1,342 users</p>
        </div>
      </div>
    );
  }
}

export default translate({ withRef: true })(AddonMetaBase);
