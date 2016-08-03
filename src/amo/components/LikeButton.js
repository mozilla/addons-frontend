import React, { PropTypes } from 'react';

import translate from 'core/i18n/translate';

import 'amo/css/LikeButton.scss';

export class LikeButton extends React.Component {
  static propTypes = {
    i18n: PropTypes.object,
  }

  render() {
    const { i18n } = this.props;

    // This is just a placeholder.
    return (
      <button className="LikeButton">
        <span className="visually-hidden">{i18n.gettext('Mark as liked')}</span>
      </button>
    );
  }
}

export default translate({ withRef: true })(LikeButton);
