import React, { PropTypes } from 'react';

import translate from 'core/i18n/translate';

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
        <div className="category security">
          <h3 className="visually-hidden">{i18n.gettext('Category')}</h3>
          <p>Security &amp; Privacy</p>
        </div>

        <div className="users">
          <h3 className="visually-hidden">{i18n.gettext('Used by')}</h3>
          <p>1,342 users</p>
        </div>

        <div className="sentiment love-it">
          <h3 className="visually-hidden">{i18n.gettext('Sentiment')}</h3>
          <p>89% love it!</p>
        </div>
      </div>
    );
  }
}

export default translate({ withRef: true })(AddonMetaBase);
